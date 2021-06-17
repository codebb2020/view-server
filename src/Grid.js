import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
//import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import 'ag-grid-community/dist/styles/ag-theme-balham-dark.css';
import { Command } from 'amps';

const matcher = message => row => row.key === message.header.sowKey();

export default class Grid extends Component { 
    state = {rowData: []};

    
    async sowAndSubscribe() {
        // create a command object
        const cmd = new Command('sow_and_subscribe');
        cmd.topic(this.props.topic);
        cmd.orderBy(this.props.orderBy);
        cmd.options(this.props.options);

        // execute the command
        let rowData;
        this.subId = await this.props.client.execute(cmd, message => {
            switch (message.header.command()) {
                case 'group_begin': // Begin receiving the initial dataset
                    rowData = [];
                    break;
                case 'sow': // This message is a part of the initial dataset
                    message.data.key = message.header.sowKey();
                    rowData.push(message.data);
                    break;
                case 'group_end': // Initial Dataset has been delivered
                    this.setState({ rowData });
                    break;
                case 'oof': // Out-of-Focus -- a message should no longer be in the grid
                    this.onOOF(message);
                    break;
                default: // Publish -- either a new message or an update
                    this.onPublish(message);
            }
        });
    }

    onOOF(message) {
        const rowIndex = this.state.rowData.findIndex(matcher(message));
    
        if (rowIndex >= 0) {
            const rowData = this.state.rowData.filter(row => row.key !== message.header.sowKey());
            this.setState({ rowData });
        }
    }

    onPublish(message) {
        const rowIndex = this.state.rowData.findIndex(matcher(message));
        const rowData = this.state.rowData.slice();
    
        if (rowIndex >= 0) {
            rowData[rowIndex] = {...rowData[rowIndex], ...message.data};
        }
        else {
            message.data.key = message.header.sowKey();
            rowData.push(message.data);
        }
    
        this.setState({ rowData });
    }
    async onGridReady(params) {
        // resize columns to fit the width of the grid 
        params.api.sizeColumnsToFit();
    
        try {
            // subscribe to the topic data and atomic updates
            await this.sowAndSubscribe();
        }
        catch (err) {
            this.setState({rowData: []});
            console.error('err: ', err);
        }
    }

    render() {
        return (
            <div 
                    className="ag-theme-balham-dark" 
                    style={{
                        height: this.props.height || '595px',
                        width: this.props.width || '600px'
                    }}
                >

                <div className="grid-header">{this.props.title}</div>
                <AgGridReact
                    columnDefs={this.props.columnDefs}
    
                    // we now use state to track row data changes
                    rowData={this.state.rowData} 
    
                    // unique identification the row based on the SowKey
                    getRowNodeId={row => row.key}
    
                    // the provided callback is invoked once the grid is initialized
                    onGridReady={params => this.onGridReady(params)}
    
                    // react update mechanism for efficient state merges
                    deltaRowDataMode  
    
                    // resize columns on grid resize
                    onGridSizeChanged={params => params.api.sizeColumnsToFit()}
                />
            </div>
        );
    }

}