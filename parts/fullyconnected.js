import React from 'react';

class FullyConnected extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.canvas = React.createRef();
  }

  draw() {
    let {
      width,
      height,
      letter_positions,
      pixel_positions,
      art,
      fwidth,
      fheight,
    } = this.props;
    let canvas = this.canvas.current;

    canvas.width = width;
    canvas.height = height;

    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = `white`;

    // ctx.fillStyle = `hsla(${Math.random() * 360}, 50%, 50%, 1)`;
    for (let i = 0; i < letter_positions.length; i++) {
      let p = letter_positions[i];
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    for (let i = 0; i < pixel_positions.length; i++) {
      // ctx.fillStyle = `hsla(${Math.random() * 360}, 50%, 50%, 1)`;
      let p = pixel_positions[i];
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    let filtered = art.filter(a => a.letter_index !== null);

    ctx.beginPath();
    for (let i = 0; i < letter_positions.length; i++) {
      // ctx.fillStyle = `hsla(${Math.random() * 360}, 50%, 50%, 1)`;
      let p = pixel_positions[i];
      let l = letter_positions[filtered[i].letter_index];
      ctx.moveTo(p.x + fwidth / 2, p.y + fheight / 2);
      ctx.lineTo(l.x + fwidth / 2, l.y + fheight / 2);
    }
    ctx.stroke();
  }

  componentDidMount() {
    this.draw();
  }

  componentDidUpdate(prevProps) {
    if (this.props.text.length !== prevProps.text.length) {
      this.draw();
    }
  }

  render() {
    let { padding, width, height } = this.props;
    return (
      <canvas
        ref={this.canvas}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width,
          height: height,
        }}
      />
    );
  }
}

export default FullyConnected;
