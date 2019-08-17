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

  setTextCenter() {
    let { width, height, font_size, line_height, fratio } = this.props;
    let { rows } = getLayout(width, height, font_size, line_height, fratio);

    let text_height = this.textRef.current.offsetHeight;

    let char_height = font_size * line_height;
    let char_width = Math.round(char_height * fratio * 100) / 100;

    let offset = Math.floor((rows - Math.round(text_height / char_height)) / 2);

    this.setState({ top_offset: offset });
  }

  componentDidMount() {
    this.setTextCenter();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.text.length !== prevProps.text.length ||
      this.props.width !== prevProps.width ||
      this.props.height !== prevProps.height
    ) {
      this.setTextCenter();
    }
  }

  render() {
    let { top_offset } = this.state;
    let {
      right_columns,
      fwidth,
      text,
      font_size,
      line_height,
      art,
      orientation,
    } = this.props;

    return (
      <div
        ref={this.textRef}
        style={{
          position: 'relative',
          width: right_columns * fwidth,
          marginTop:
            orientation === 'v'
              ? font_size * line_height
              : top_offset * font_size * line_height,
          whiteSpace: 'pre-wrap',
          maxWidth: fwidth * 70 + 1,
        }}
        dangerouslySetInnerHTML={{
          __html: linkify(text.map(t => t.letter).join('')),
        }}
      />
    );
  }
}

export default TextSide;
