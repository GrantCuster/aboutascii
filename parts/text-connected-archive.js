import React from 'react';
import { getLayout, displayText, linkify } from '../parts/utils.js';

class TextSide extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      top_offset: null,
    };
    this.textRef = React.createRef();

    this.setTextCenter - this.setTextCenter.bind(this);
  }

  setTextCenter(callback) {
    let { width, height, font_size, line_height, fratio } = this.props;
    let { rows } = getLayout(width, height, font_size, line_height, fratio);

    let text_height = this.textRef.current.offsetHeight;

    let char_height = font_size * line_height;
    let char_width = Math.round(char_height * fratio * 100) / 100;

    let offset = Math.floor((rows - Math.round(text_height / char_height)) / 2);

    this.setState({ top_offset: offset }, callback);
  }

  componentDidMount() {
    this.setTextCenter();
  }

  componentDidUpdate(prevProps) {
    if (this.props.text.length !== prevProps.text.length) {
      this.setTextCenter();
    }
  }

  render() {
    let { top_offset } = this.state;
    let {
      right_columns,
      fwidth,
      text,
      letterEnter,
      font_size,
      line_height,
      art,
    } = this.props;

    return (
      <div
        ref={this.textRef}
        style={{
          position: 'relative',
          width: right_columns * fwidth,
          marginTop: top_offset * font_size * line_height,
          whiteSpace: 'pre-wrap',
          maxWidth: fwidth * 70 + 1,
        }}
      >
        {displayText(text.map(t => t.letter).join('')).map(n => {
          return n.node === 'link' ? (
            <a href={n.content.map(t => t[0]).join('')}>
              {n.content.map(t => (
                <span
                  className="text_letter"
                  onMouseEnter={letterEnter.bind(this, t[1])}
                  key={t[1]}
                >
                  {t[0]}
                </span>
              ))}
            </a>
          ) : (
            <span>
              {n.content.map(t => (
                <span
                  className="text_letter"
                  onMouseEnter={letterEnter.bind(this, t[1])}
                  key={t[1]}
                >
                  {t[0]}
                </span>
              ))}
            </span>
          );
        })}
        <div
          style={{
            color: '#888',
            display: 'none',
          }}
          dangerouslySetInnerHTML={{
            __html:
              `\n` +
              linkify(
                `> The ${
                  text.length
                } characters from the description text are placed within the ${
                  art.length
                } pixels rescaled from an image of my face. Read more about how it works at ${
                  window.location.href
                }source`
              ) +
              '.',
          }}
        />
      </div>
    );
  }
}

export default TextSide;
