import App, { Container } from 'next/app';
import React from 'react';
import Style from '../parts/style.js';

class StyledLoader extends React.Component {
  render() {
    return <div style={{ paddingTop: 4, paddingLeft: 4 }}>-</div>;
  }
}

class MyApp extends App {
  constructor(props) {
    super(props);
    this.state = {
      width: null,
      height: null,
      origin: null,
      date: null,
    };
    this.setSize = this.setSize.bind(this);
  }

  setSize() {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
      origin: window.location.href,
      date: new Date(),
    });
  }

  componentDidMount() {
    this.setSize();
    window.addEventListener('resize', this.setSize, false);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize, false);
  }

  render() {
    let { Component } = this.props;
    let { width, height } = this.state;
    return (
      <div>
        <style jsx global>{`
          html {
            background: #efefef;
          }
        `}</style>
        <Container>
          {width !== null && height !== null ? (
            <Component {...this.state} />
          ) : null}
        </Container>
      </div>
    );
  }
}

export default MyApp;
