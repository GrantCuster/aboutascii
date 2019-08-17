import React from 'react';
import marked from 'marked';
import Style from '../parts/style.js';
import _ from 'lodash';

let md = `# Grant Custer 

I'm a designer and front-end developer interested in
procedural generation, data visualization, product design and rethinking
things from scratch.

## Links
- [Feed](http://feed.grantcuster.com)
- [Observable](https://observablehq.com/@grantcuster)
- link`;

let raw = `Grant Custer 
Design–Code

I'm a designer and front-end developer interested in procedural generation, data visualization, product design and rethinking things from scratch.

I work at Cloudera Fast Forward Labs where we build prototypes and write reports on near future technologies.

Links
- Feed - http://feed.grantcuster.com
- Observable - https://observablehq.com/@grantcuster
- Feed - http://feed.grantcuster.com
- Observable - https://observablehq.com/@grantcuster`;

function getColumnNumber(width, c_width, set_even = false) {
  let columns = Math.floor(width / c_width);
  if (set_even) columns = Math.floor(columns / 2) * 2;
  return columns;
}

function getRowNumber(height, r_height) {
  return Math.floor(height / r_height);
}

function contain(c, r, aspect) {
  let _w, _h;
  if (aspect >= c / r) {
    // wider
    _w = c;
    _h = Math.round(c / aspect);
  } else {
    // taller
    _h = r;
    _w = Math.round(r * aspect);
  }
  let x = Math.floor((c - _w) / 2);
  let y = Math.floor((r - _h) / 2);
  return { w: _w, h: _h, x, y };
}

function getQuads(columns, rows, data) {
  // https://www.dfstudios.co.uk/articles/programming/image-programming-algorithms/image-processing-algorithms-part-5-contrast-adjustment/
  let contrast_set = 60;
  let contrast = (259 * (contrast_set + 255)) / (255 * (259 - contrast_set));

  let chars = [];
  for (var i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    // https://stackoverflow.com/a/596241/8691291
    let luma = 0.299 * r + 0.587 * g + 0.114 * b;
    let cluma =
      1 - Math.min(Math.max(0, contrast * (luma - 128) + 128), 255) / 255;
    chars.push(cluma);
  }

  let double_rows = [];
  for (let r = 0; r < rows / 2; r++) {
    let double = chars.slice(r * (columns * 2), (r + 1) * columns * 2);
    double_rows.push(double);
  }

  let quads = [];
  for (let dr = 0; dr < double_rows.length; dr++) {
    let drow = double_rows[dr];
    let group = [];
    for (let g = 0; g < columns / 2; g++) {
      let top = drow.slice(g * 2, (g + 1) * 2);
      let bottom = drow.slice(columns + g * 2, columns + (g + 1) * 2);
      let grouped = [...top, ...bottom];
      quads.push({ index: g + dr * columns * 2, val: grouped });
    }
  }

  return quads;
}

function distance(a, b) {
  // from https://developer.hyvor.com/js-euclidean-distance
  return (
    a
      .map((x, i) => Math.abs(x - b[i]) ** 2) // square the difference
      .reduce((sum, now) => sum + now) ** // sum
    (1 / 2)
  );
}

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mount_check: 'unmounted',
      quads: null,
      letters: null,
      pixel_letters: null,
    };
    this.setQuads = this.setQuads.bind(this);
    this.setLetters = this.setLetters.bind(this);
  }

  setQuads(image) {
    let { box } = this.getLayout();

    let canvas = document.createElement('canvas');
    canvas.width = box.w * 2;
    canvas.height = box.h * 2;
    let ctx = canvas.getContext('2d');
    // turn off image aliasing
    ctx.msImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, box.w * 2, box.h * 2);
    let image_data = ctx.getImageData(0, 0, box.w * 2, box.h * 2);

    let quads = getQuads(box.w * 2, box.h * 2, image_data.data);

    this.setState({ quads: quads }, function() {
      this.setLetters();
    });
  }

  setLetters() {
    let { font_size, line_height, ratio } = this.props;
    let font = 'IBM Plex Mono';

    let sorted = _.orderBy(
      this.state.quads,
      function(q) {
        return q.val.reduce(function(acc, current) {
          return acc + current;
        }, 0);
      },
      'desc'
    );

    let mod = raw.replace(/\n/g, ' ');
    let letters = mod.split('');
    let unique_letters = _.uniq(letters);

    let temp = unique_letters.map(l => {
      let fs = font_size * 8;
      let height = fs * line_height;
      let width = Math.ceil(ratio * height);

      // divide up the letter areas
      let columns = 2;
      let rows = 2;
      let regions = [...Array(columns * rows)].map((n, i) => {
        let canvas = document.createElement('canvas');
        let r = Math.floor(i / columns);
        let c = i % columns;
        canvas.width = width / columns;
        canvas.height = height / rows;
        let x = c * (width / columns);
        let y = r * (height / columns);
        let ctx = canvas.getContext('2d');
        ctx.font = `${fs}px ${font}`;
        ctx.fillText(l, -x, -y + height * (3 / 4));

        let data = ctx.getImageData(0, 0, width, height).data;
        let vals = [];
        for (let i = 0; i < data.length; i += 4) {
          // check alpha
          let a = data[i + 3];
          let val = a > 255 / 2 ? 1 : 0;
          vals.push(val);
        }
        let ons = vals.filter(v => v === 1);
        let percent = ons.length / vals.length;

        return { canvas, percent };
      });

      return regions;
    });

    // rescale
    let max = _.max(_.flatten(temp.map(r => r.map(o => o.percent))));
    let rescaled = temp.map(r => {
      return r.map(o => {
        return Object.assign({}, o, { percent: o.percent / max });
      });
    });

    let lookup = {};
    for (let i = 0; i < rescaled.length; i++) {
      lookup[unique_letters[i]] = rescaled[i];
    }
    console.log(lookup);

    let matched = [];
    for (let p = 0; p < sorted.length; p++) {
      let target = sorted[p];
      let checks = letters.map((l, i) => {
        let percents = lookup[l].map(p => p.percent);
        let sim = distance(target.val, percents);
        return { percent: percents, sim, letter: l, letter_index: i };
      });
      let _sorted = _.orderBy(checks, 'sim', 'asc');
      if (_sorted.length > 0) {
        let chosen = _sorted[0];
        chosen.target_index = target.index;
        let check = letters.splice(chosen.letter_index, 1);
        matched.push(chosen);
      } else {
        matched.push({ letter: ' ', target_index: target.index });
      }
    }

    let ordered = _.orderBy(matched, 'target_index');

    console.log(ordered);

    this.setState({ letters: unique_letters, pixel_letters: ordered });
  }

  componentDidMount() {
    let image = new Image();
    image.onload = () => {
      this.setQuads(image);
    };
    image.src = `/static/images/grant.png`;

    this.setState({ mount_check: 'mounted' });
  }

  getLayout() {
    let { width, height, font_size, line_height, ratio } = this.props;

    let char_height = font_size * line_height;
    let char_width = Math.round(char_height * ratio * 100) / 100;

    let padding = char_height / 4;

    let columns = getColumnNumber(width - padding * 2, char_width);
    let rows = getRowNumber(height - padding * 2, char_height);
    let grid = {
      w: columns * char_width,
      h: rows * char_height,
    };

    let split_padding = 2;
    let left_columns = Math.floor(columns / 2) - split_padding;
    let right_columns = Math.ceil(columns / 2) - split_padding;

    let box = contain(left_columns, rows, 1 / ratio);

    return {
      char_height,
      char_width,
      padding,
      columns,
      rows,
      grid,
      split_padding,
      left_columns,
      right_columns,
      box,
    };
  }

  render() {
    let { quads, letters, pixel_letters } = this.state;
    let {
      char_height,
      char_width,
      padding,
      columns,
      rows,
      grid,
      split_padding,
      left_columns,
      right_columns,
      box,
    } = this.getLayout();

    return (
      <div
        style={{
          fontFamily: "'IBMPlexMono-Regular', 'IBM Plex Mono'",
          position: 'relative',
        }}
      >
        {true ? (
          <div
            style={{
              position: 'absolute',
              width: grid.w,
              height: grid.h,
              left: padding,
              top: padding,
              display: 'flex',
              flexWrap: 'wrap',
              display: 'none',
            }}
          >
            {[...Array(columns * rows)].map(n => (
              <div
                style={{
                  width: char_width,
                  height: char_height,
                  outline: 'solid 1px #ccc',
                }}
              />
            ))}
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            width: grid.w,
            height: grid.h,
            left: padding,
            top: padding,
            display: 'flex',
          }}
        >
          <div
            style={{
              width: left_columns * char_width,
              height: grid.h,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: box.x * char_width,
                top: box.y * char_height,
                width: box.w * char_width + 1,
                height: box.h * char_height,
                display: 'flex',
                flexWrap: 'wrap',
                display: 'none',
              }}
            >
              {quads !== null
                ? quads.map(q => {
                    return (
                      <div
                        style={{
                          width: char_width,
                          height: char_height,
                          display: 'flex',
                          flexWrap: 'wrap',
                        }}
                      >
                        {q.val.map(v => (
                          <div
                            style={{
                              width: char_width / 2,
                              height: char_height / 2,
                              background: `rgba(${v * 255}, ${v * 255}, ${v *
                                255}, 1)`,
                            }}
                          />
                        ))}
                      </div>
                    );
                  })
                : null}
            </div>
            <div
              style={{
                position: 'absolute',
                left: box.x * char_width,
                top: box.y * char_height,
                width: box.w * char_width + 1,
                height: box.h * char_height,
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {pixel_letters !== null
                ? pixel_letters.map(l => {
                    return (
                      <div style={{ width: char_width, height: char_height }}>
                        {l.letter}
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
          <div
            style={{
              width: right_columns * char_width,
              height: grid.h,
              marginLeft: char_width * split_padding * 2,
            }}
          >
            <div
              style={{ whiteSpace: 'pre-wrap', maxWidth: char_width * 70 + 1 }}
            >
              {raw}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Style(Index);
