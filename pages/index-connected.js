import React from 'react';
import { getLayout, getLetters } from '../parts/utils.js';
import { raw } from '../parts/constants.js';
import Style from '../parts/style.js';
import TextSide from '../parts/text.js';
import Art from '../parts/art.js';
import FullyConnected from '../parts/fullyconnected.js';
import _ from 'lodash';

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: null,
      letter_positions: null,
      art: null,
      pixel_positions: null,
    };
    this.setArtPositions = this.setArtPositions.bind(this);
  }

  letterEnter(index) {}

  setLetterPositions(positions) {
    this.setState({ letter_positions: positions });
  }

  addGenText(text) {
    let gen_text = `

  Generated from ${
    this.props.origin
  } at ${this.props.date.toLocaleString()} for a ${this.props.width}x${
      this.props.height
    } window.`;
    return text + gen_text;
  }

  setArtPositions() {
    let { font_size, line_height, fratio } = this.props;
    let fheight = font_size * line_height;
    let fwidth = fheight * fratio;
    let spans = document.querySelectorAll('.art_letter.active');
    let positions = Array.from(spans).map(l => {
      let rect = l.getBoundingClientRect();
      let x = rect.left;
      let y = rect.top;
      return {
        x,
        y,
        w: fwidth,
        h: fheight,
      };
    });
    this.setState({ pixel_positions: positions });
  }

  setArt(art) {
    this.setState({ art: art });
  }

  componentDidMount() {
    let { font_size, line_height, fratio } = this.props;
    let raw_and_gen = this.addGenText(raw);
    let counter = 0;
    setInterval(() => {
      let text = getLetters(raw_and_gen.slice(0, counter), {
        font_size,
        line_height,
        ratio: fratio,
      });
      this.setState({ text: text });
      counter++;
    }, 20);
  }

  render() {
    let { text, letter_positions, art, pixel_positions } = this.state;
    let { width, height, font_size, line_height, fratio } = this.props;
    let {
      left_columns,
      fwidth,
      fheight,
      right_columns,
      padding,
      orientation,
      rows,
    } = getLayout(width, height, font_size, line_height, fratio);

    return (
      <div>
        {letter_positions !== null && pixel_positions !== null && false ? (
          <FullyConnected
            padding={padding}
            width={width}
            height={height}
            letter_positions={letter_positions}
            pixel_positions={pixel_positions}
            fwidth={fwidth}
            fheight={fheight}
            text={text}
            art={art}
          />
        ) : null}
        <div
          style={{
            display: orientation === 'h' ? 'flex' : 'block',
            justifyContent: orientation === 'h' ? 'space-between' : 'auto',
            paddingLeft: padding,
            paddingRight: padding,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: left_columns * fwidth,
            }}
          >
            {text !== null ? (
              <Art
                {...this.props}
                left_columns={left_columns}
                rows={rows}
                text={text}
                setArt={this.setArt.bind(this)}
                fwidth={fwidth}
                fheight={fheight}
                art={art}
              />
            ) : null}
          </div>
          <div
            style={{
              position: 'relative',
              width: right_columns * fwidth,
            }}
          >
            {text !== null && art !== null ? (
              <TextSide
                {...this.props}
                right_columns={right_columns}
                fwidth={fwidth}
                fheight={fheight}
                text={text}
                letterEnter={this.letterEnter}
                setLetterPositions={this.setLetterPositions.bind(this)}
                padding={padding}
                text={text}
                art={art}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default Style(Index);
