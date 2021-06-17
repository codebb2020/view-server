import { Client, DefaultServerChooser, DefaultSubscriptionManager } from 'amps';
import React, { Component } from 'react';
import Grid from './Grid';
import './App.css';


// constants
const HOST = 'localhost';
const PORT = '8088';


class App extends Component {
    // the state of the component is the AMPS Client object
    state = {client: null};

    // create a client once the component did mount
    async componentDidMount() {
        // create the server chooser
        const chooser = new DefaultServerChooser();
        chooser.add(`ws://${HOST}:${PORT}/amps/json`);

        // create the AMPS HA client object
        const client = new Client('view-server');
        client.serverChooser(chooser);
        client.subscriptionManager(new DefaultSubscriptionManager());

        // now we can establish connection 
        await client.connect();

        // update the state
        this.setState({ client });
    }

    // disconnect the client from AMPS when the component is destructed
    componentWillUnmount() {
        if (this.state.client) {
            this.state.client.disconnect();
        }
    }

    render() {
        // client is not ready yet, render "Loading..." label only
        if (!this.state.client) {
            return (<div>Loading...</div>);
        }

        return (
          <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
              <Grid 
              title="Top 20 Symbols by BID"
                  client={this.state.client}
                  columnDefs={[
                      {headerName: 'Symbol', field: 'symbol'}, 
                      {headerName: 'Bid', field: 'bid', sort: 'desc'},
                      {headerName: 'Ask', field: 'ask'}
                  ]}
                  topic="market_data"
                  options="oof,conflation=3000ms,top_n=20,skip_n=0"
                  orderBy="/bid DESC"
              />

              <Grid 
              title="Top 50 Symbols by BID"
                  client={this.state.client}
                  columnDefs={[
                      {headerName: 'Symbol', field: 'symbol'}, 
                      {headerName: 'Bid', field: 'bid'}, 
                      {headerName: 'Ask', field: 'ask', sort: 'asc'}
                  ]}
                  topic="market_data"
                  options="oof,conflation=500ms,top_n=50,skip_n=10"
                  orderBy="/ask ASC"
              />
          </div>
      );
    }
}

export default App;