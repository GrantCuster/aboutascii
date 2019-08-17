import React from 'react';
import { getQuads, contain, getDistance } from '../parts/utils';

class Art extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      image: null,
    };
    this.renderArt = this.renderArt.bind(this);
  }

  renderArt() {
    let { image } = this.state;
    let { left_columns, rows, fratio, text, setArt } = this.props;

    let container = contain(left_columns, rows, 1 / fratio);

    let quads = getQuads(container, image);

    let letters = text.slice();

    function sortCombined(a, b) {
      return b.combined - a.combined;
    }
    letters.sort(sortCombined);

    let og_letters_length = letters.length;

    function compareDistance(a, b) {
      return a.distance - b.distance;
    }

    let limit = 40;
    let matched = quads.map((q, i) => {
      if (i < og_letters_length) {
        for (let l = 0; l < letters.lengtht; l++) {
          let letter = letters[l];
          letter.distance = getDistance(q.percents, letter.percents);
        }
        letters.sort(compareDistance);
        let chosen = letters.splice(0, 1)[0];
        return {
          letter: chosen.letter === `\n` ? ` ` : chosen.letter,
          index: q.index,
          letter_index: chosen.index,
          percents: q.percents,
        };
      } else {
        return {
          letter: ' ',
          index: q.index,
          letter_index: null,
          percents: q.percents,
        };
      }
    });

    function indexSort(a, b) {
      return a.index - b.index;
    }

    matched.sort(indexSort);

    setArt(matched);
  }

  componentDidMount() {
    let image = new Image();
    image.onload = () => {
      this.setState({ image: image }, () => {
        this.renderArt(image);
      });
    };
    image.src = `/static/images/grant.png`;
  }

  componentDidUpdate(prevProps) {
    if (this.props.text.length !== prevProps.text.length) {
      this.renderArt(this.state.image);
    }
  }

  render() {
    let { art } = this.props;

    let {
      left_columns,
      rows,
      fratio,
      fwidth,
      fheight,
      text,
      setArt,
    } = this.props;

    let container = contain(left_columns, rows, 1 / fratio);

    return art !== null ? (
      <div
        style={{
          width: container.w * fwidth + 1,
          height: container.h * fheight,
          marginTop: container.y * fheight,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {art.map((l, i) =>
          (i + 1) % container.w === 0 ? (
            <span>
              <span
                className={`art_letter ${
                  l.letter_index !== null ? 'active' : ''
                }`}
              >
                {l.letter}
              </span>
              {`\n`}
            </span>
          ) : (
            <span
              className={`art_letter ${
                l.letter_index !== null ? 'active' : ''
              }`}
            >
              {l.letter}
            </span>
          )
        )}
      </div>
    ) : null;
  }
}

export default Art;
