import React from 'react';
import { typing } from '../parts/data.js';
import {
  getLayout,
  getLetters,
  contain,
  requestInterval,
} from '../parts/utils.js';
import { simple_text } from '../parts/constants.js';
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
    // let raw_and_gen = this.addGenText(raw);
    // let raw_and_gen = raw;
    // let counter = 0;

    // let text = getLetters(simple_text, {
    //   font_size,
    //   line_height,
    //   ratio: fratio,
    // });
    // this.setState({ text: text });

    let counter = 0;
    requestInterval(() => {
      let text = getLetters(simple_text.slice(0, counter), {
        font_size,
        line_height,
        ratio: fratio,
      });
      this.setState({ text: text });
      counter++;
    }, 20);

    // let progress = 0;

    // let lookup = typing.slice();

    // let me = this;
    // function step(timestamp) {
    //   // probably a cleaner way to do this
    //   if (lookup.length === 1) {
    //     if (progress > lookup[0][1]) {
    //       let splice = lookup.splice(0, 1);
    //       let text = getLetters(splice[0][0], {
    //         font_size,
    //         line_height,
    //         ratio: fratio,
    //       });
    //       me.setState({
    //         text: text,
    //       });
    //     }
    //   } else {
    //     for (let i = 0; i < lookup.length; i++) {
    //       let time = lookup[i][1];
    //       if (time > progress) {
    //         let end = i;
    //         if (end > 0) {
    //           let splice = lookup.splice(0, end);
    //           let last = splice[splice.length - 1];
    //           let text = getLetters(last[0], {
    //             font_size,
    //             line_height,
    //             ratio: fratio,
    //           });
    //           me.setState({
    //             text: text,
    //           });
    //         }
    //         break;
    //       }
    //     }
    //   }

    //   if (lookup.length > 0) {
    //     animation_id = requestAnimationFrame(step);
    //   }

    //   progress += (1 / 60 / (1 / 1000)) * 4;
    // }

    // let animation_id = requestAnimationFrame(step);
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
      columns,
      rows,
      box,
    } = getLayout(width, height, font_size, line_height, fratio);

    let container = contain(left_columns, rows, 1 / fratio);

    return (
      <div>
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
              overflow: 'hidden',
              width:
                orientation === 'v' ? columns * fwidth : left_columns * fwidth,
            }}
          >
            <div
              style={{
                marginLeft:
                  orientation === 'v'
                    ? container.w < columns
                      ? Math.floor((columns - container.w) / 2) * fwidth
                      : -Math.ceil((left_columns - columns) / 2) * fwidth
                    : 0,
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
                  orientation={orientation}
                />
              ) : null}
            </div>
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
                padding={padding}
                text={text}
                art={art}
                orientation={orientation}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default Style(Index);
