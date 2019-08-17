import React from 'react';
import marked from 'marked';
import Style from '../parts/style.js';
import _ from 'lodash';

let font = 'IBM Plex Sans';

let raw = `Grant Custer 
Design–Code

  I'm a designer and front-end developer interested in procedural generation, data visualization, product design and rethinking things from scratch.
  I work at Cloudera Fast Forward Labs where we build prototypes and write reports on near future technologies.

Selected links
- http://feed.grantcuster.com – Work and inspiration in progress.
- https://twitter.com/grantcuster - Tweets.
- https://observablehq.com/@grantcuster – Code and design experiments.
- https://experiments.fastforwardlabs.com – Prototypes, demos, and code by Cloudera Fast Forward Labs.

`;

function linkify(text) {
  // from https://ctrlq.org/code/20294-regex-extract-links-javascript
  return (text || '').replace(
    /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
    function(match, space, url) {
      var hyperlink = url;
      if (!hyperlink.match('^https?://')) {
        hyperlink = 'http://' + hyperlink;
      }
      return (
        space +
        '<a href="' +
        hyperlink +
        '" style="word-break: break-all;">' +
        url +
        '</a>'
      );
    }
  );
}

function wrapCharacters(element) {
  // from https://stackoverflow.com/a/9666441/8691291
  var child = element.firstChild;
  let index_counter = 0;
  while (child) {
    // have to get a reference before we replace the child node
    var nextSibling = child.nextSibling;

    if (child.nodeType === 1) {
      // element node
      wrapCharacters(child);
    } else if (child.nodeType === 3) {
      // text node
      var d_ = document.createDocumentFragment();

      for (var i = 0, len = child.nodeValue.length; i < len; i++) {
        var span = document.createElement('span');
        span.innerHTML = child.nodeValue.charAt(i);
        span.setAttribute('index', index_counter);
        span.className = 'text-char';
        d_.appendChild(span);
        index_counter++;
      }
      // document fragments are just awesome
      child.parentNode.replaceChild(d_, child);
    }
    child = nextSibling;
  }
}

function indexExcludeLinks(text) {
  let wrap = document.createElement('div');
  wrap.innerHTML = text;
  // mutates
  wrapCharacters(wrap);
  return wrap.innerHTML;
}

function getColumnNumber(width, c_width) {
  let columns = Math.floor(width / c_width);
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

function getQuads(box, image) {
  let columns = box.w * 2;
  let rows = box.h * 2;

  let canvas = document.createElement('canvas');

  // double because 4 pixels
  canvas.width = box.w * 2;
  canvas.height = box.h * 2;
  let ctx = canvas.getContext('2d');

  // turn off image aliasing
  ctx.msImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(image, 0, 0, box.w * 2, box.h * 2);
  let data = ctx.getImageData(0, 0, box.w * 2, box.h * 2).data;

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

  let temp = [];
  for (let r = 0; r < rows / 2; r++) {
    let double = chars.slice(r * (columns * 2), (r + 1) * columns * 2);
    for (let g = 0; g < columns / 2; g++) {
      let top = double
        .slice(g * 2, (g + 1) * 2)
        .map(p => Math.round(p * 1000) / 1000);
      let bottom = double
        .slice(columns + g * 2, columns + (g + 1) * 2)
        .map(p => Math.round(p * 1000) / 1000);
      let grouped = top.concat(bottom);
      let combined = grouped.reduce((acc, current) => acc + current);
      temp.push({ index: g + r * columns * 2, percents: grouped, combined });
    }
  }

  let quads = _.orderBy(temp, ['combined', 'index'], ['desc', 'asc']);

  return quads;
}

function getLetters(text, style) {
  let { font_size, line_height, ratio } = style;

  let letters = text.replace(/\n/g, ' ').split('');
  let unique_letters = _.uniq(letters);

  // canvases to measure pixels
  let fs = font_size * 4;
  let height = fs * line_height;
  let width = Math.ceil(ratio * height);
  let columns = 2;
  let rows = 2;
  let canvas = document.createElement('canvas');
  canvas.width = width / columns;
  canvas.height = height / rows;
  let ctx = canvas.getContext('2d');
  ctx.font = `${fs}px ${font}`;

  let temp = unique_letters.map(l => {
    ctx.clearRect(0, 0, width / columns, height / columns);
    let regions = [...Array(columns * rows)].map((n, i) => {
      let r = Math.floor(i / columns);
      let c = i % columns;
      let x = c * (width / columns);
      let y = r * (height / columns);
      ctx.fillText(l, -x, -y + height * (3 / 4));
      let data = ctx.getImageData(0, 0, width, height).data;
      let on = 0;
      for (let i = 0; i < data.length; i += 4) {
        // check alpha
        let a = data[i + 3];
        if (a > 255 / 2) on++;
      }
      let percent = Math.round((on / (data.length / 4)) * 1000) / 1000;
      return percent;
    });
    return regions;
  });

  let max = _.max(_.flatten(temp));

  let lookup = {};
  for (let i = 0; i < temp.length; i++) {
    // rescale by max
    let percents = temp[i].map(n => n / max);
    lookup[unique_letters[i]] = percents;
  }

  let letter_percents = letters.map((l, i) => {
    return {
      letter: l,
      percents: lookup[l],
      combined: lookup[l].reduce((acc, curr) => acc + curr),
      letter_index: i,
    };
  });

  function sortCombined(a, b) {
    return b.combined - a.combined;
  }
  letter_percents.sort(sortCombined);

  return letter_percents;
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
      image: null,
      text: null,
      ascii: null,
      center_offset: 0,
      quads: null,
    };
    this.addGenText = this.addGenText.bind(this);
    this.textRef = React.createRef();
    this.backer = React.createRef();
    this.highlighter = React.createRef();
    this.quader = React.createRef();
    this.setTextCenter = this.setTextCenter.bind(this);
  }

  // makeCursor() {
  //   let { font_size, line_height, ratio } = this.props;
  //   let char_height = font_size * line_height;
  //   let char_width = Math.round(char_height * ratio * 100) / 100;
  //   let canvas = document.createElement('canvas')
  //   canvas.width = char_width + 2
  //   canvas.height = char_height + 2
  //   let ctx = canvas.getContext('2d')
  //   ctx.fillRect(1, 1, char_width, char_height)
  // }

  renderAscii(image) {
    let { box, grid, padding, rows, columns } = this.getLayout();
    let { font_size, line_height, ratio } = this.props;
    let style = { font_size, line_height, ratio };

    let quads = getQuads(box, image);
    let letters = getLetters(this.state.text, style);
    let og_letters_length = letters.length;

    let quad_count = quads.length;

    function compareDistance(a, b) {
      return a.distance - b.distance;
    }

    let limit = 40;
    let matched = quads.map((q, i) => {
      if (i < og_letters_length) {
        // overwriting to avoid a map, probably not worth it
        for (let l = 0; l < Math.min(letters.length, limit); l++) {
          let letter = letters[l];
          letter.distance = distance(q.percents, letter.percents);
        }
        letters.sort(compareDistance);
        let chosen = letters.splice(0, 1)[0];
        return {
          letter: chosen.letter,
          index: q.index,
          letter_index: chosen.letter_index,
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

    let ascii = '';

    // TODO: remove dots if you never use them, cursor setting too
    for (let m = 0; m < matched.length; m++) {
      ascii += `<span class="ascii-char" ascii-index="${m}" letter-index="${
        matched[m].letter_index
      }" percents="${JSON.stringify(
        matched[m].percents
      )}" style="display: inline-block; cursor: ${
        matched[m].letter_index === null ? 'none' : 'none'
      }; color: ${
        matched[m].letter_index === null ? 'rgba(0,0,0,0.0)' : 'black'
      }">${matched[m].letter_index === null ? '·' : matched[m].letter}</span>`;
      if ((m + 1) % box.w === 0) {
        ascii += '\n';
      }
    }
    ascii += '\n\n';

    this.setState({ ascii, quads }, () => {
      let check = document.querySelectorAll('.ascii-char');
      let letters = document.querySelectorAll('.text-char');

      let ct = this.highlighter.current.getContext('2d');
      ct.strokeStyle = 'black';
      ct.lineWidth = 1;
      ct.fillStyle = '#fff';

      for (let i = 0; i < check.length; i++) {
        check[i].addEventListener('mouseenter', e => {
          ct.clearRect(0, 0, grid.w, grid.h);
          let li = e.currentTarget.getAttribute('letter-index');

          let rect = e.currentTarget.getBoundingClientRect();

          let percents = JSON.parse(e.currentTarget.getAttribute('percents'));
          for (let p = 0; p < percents.length; p++) {
            let per = percents[p];
            let v = 255 - per * 255;
            ct.fillStyle = `rgba(${v},${v},${v},1)`;
            ct.fillRect(
              rect.left - padding + ((p + 1) % 2) * (char_width / 2),
              rect.top - padding + (Math.floor(p / 2) * char_height) / 2,
              char_width / 2,
              char_height / 2
            );
          }

          ct.strokeRect(
            rect.left - padding,
            rect.top - padding,
            char_width,
            char_height
          );

          // ct.beginPath();
          // ct.moveTo(rect.left - padding, rect.top + char_height - padding);
          // ct.lineTo(
          //   rect.left + char_width - padding,
          //   rect.top + char_height - padding
          // );
          // ct.closePath();
          // ct.stroke();

          if (li !== 'null') {
            let ai = e.currentTarget.getAttribute('ascii-index');

            let trect = letters[li].getBoundingClientRect();

            ct.strokeStyle = '#ccc';
            ct.lineWidth = 2;
            ct.beginPath();
            ct.moveTo(
              rect.left - padding + char_width / 2,
              rect.top - padding + char_height / 2,
              char_width,
              char_height
            );
            ct.lineTo(
              trect.left - padding + char_width / 2,
              trect.top - padding + char_height / 2,
              char_width,
              char_height
            );
            ct.closePath();
            ct.stroke();

            // ct.fillRect(
            //   rect.left - padding,
            //   rect.top - padding,
            //   char_width,
            //   char_height
            // );

            // ct.fillRect(
            //   trect.left - padding,
            //   trect.top - padding,
            //   char_width,
            //   char_height
            // );
            //

            // 0, 1,
            // 2, 3
            //
            //
            let percents = JSON.parse(e.currentTarget.getAttribute('percents'));
            for (let p = 0; p < percents.length; p++) {
              let per = percents[p];
              let v = 255 - per * 255;
              ct.fillStyle = `rgba(${v},${v},${v},1)`;
              ct.fillRect(
                rect.left - padding + ((p + 1) % 2) * (char_width / 2),
                rect.top - padding + (Math.floor(p / 2) * char_height) / 2,
                char_width / 2,
                char_height / 2
              );
            }

            ct.strokeStyle = 'black';
            ct.lineWidth = 1.5;

            ct.strokeRect(
              rect.left - padding,
              rect.top - padding,
              char_width,
              char_height
            );

            ct.strokeRect(
              trect.left - padding,
              trect.top - padding,
              char_width,
              char_height
            );

            // ct.beginPath();
            // ct.moveTo(rect.left - padding, rect.top + char_height - padding);
            // ct.lineTo(
            //   rect.left + char_width - padding,
            //   rect.top + char_height - padding
            // );
            // ct.closePath();
            // ct.stroke();

            // ct.beginPath();
            // ct.moveTo(trect.left - padding, trect.top + char_height - padding);
            // ct.lineTo(
            //   trect.left + char_width - padding,
            //   trect.top + char_height - padding
            // );
            // ct.closePath();
            // ct.stroke();

            // ct.strokeRect(
            //   rect.left - padding,
            //   rect.top - padding,
            //   char_width,
            //   char_height
            // );
            // ct.strokeRect(
            //   trect.left - padding,
            //   trect.top - padding,
            //   char_width,
            //   char_height
            // );

            // ct.beginPath();
            // ct.ellipse(
            //   rect.left - padding + char_width / 2,
            //   rect.top - padding + char_height / 2,
            //   char_width * 1.125,
            //   Math.PI,
            //   0,
            //   2 * Math.PI
            // );

            // ct.ellipse(
            //   trect.left - padding + char_width / 2,
            //   trect.top - padding + char_height / 2,
            //   char_width * 1.125,
            //   char_width * 1.125,
            //   Math.PI,
            //   0,
            //   2 * Math.PI
            // );
            // ct.fill();
          }
        });
      }

      let backer = this.backer.current;
      let ctx = backer.getContext('2d');

      ctx.clearRect(0, 0, grid.w, grid.h);

      let char_height = font_size * line_height;
      let char_width = Math.round(char_height * ratio * 100) / 100;

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.fillStyle = '#fff';

      ctx.beginPath();
      for (let i = 0; i < check.length; i++) {
        let el = check[i];
        if (el.getAttribute('letter-index') !== 'null') {
          let rect = el.getBoundingClientRect();
          ctx.fillRect(
            rect.left - padding,
            rect.top - padding,
            char_width,
            char_height
          );
          ctx.moveTo(
            rect.left - padding + char_width / 2,
            rect.top - padding + char_height / 2
          );
          let target_rect = letters[
            el.getAttribute('letter-index')
          ].getBoundingClientRect();
          ctx.lineTo(
            target_rect.left - padding + char_width / 2,
            target_rect.top - padding + char_height / 2
          );
          ctx.fillRect(
            target_rect.left - padding,
            target_rect.top - padding,
            char_width,
            char_height
          );
        }
      }
      ctx.stroke();
      ctx.closePath();

      let qs = _.orderBy(quads, 'index');
      let qtx = this.quader.current.getContext('2d');
      for (let i = 0; i < qs.length; i++) {
        let quad = qs[i];
        let column = i % box.w;
        let row = Math.floor(i / box.w);

        let x = column * char_width + box.x * char_width;
        let y = row * char_height + box.y * char_height;

        for (let p = 0; p < quad.percents.length; p++) {
          let per = quad.percents[p];
          let v = 255 - per * 255;
          qtx.fillStyle = `rgba(${v},${v},${v},1)`;
          qtx.fillRect(
            x + ((p + 1) % 2) * (char_width / 2),
            y + (Math.floor(p / 2) * char_height) / 2,
            char_width / 2,
            char_height / 2
          );
        }
      }
    });
  }

  addGenText(text) {
    let gen_text = `  Generated from ${
      this.props.origin
    } at ${this.props.date.toLocaleString()} for a ${this.props.width}x${
      this.props.height
    } window.`;
    return text + gen_text;
  }

  setTextCenter() {
    let { width, height, font_size, line_height, ratio } = this.props;

    let { rows } = this.getLayout();
    let text_height = this.textRef.current.offsetHeight;

    let char_height = font_size * line_height;
    let char_width = Math.round(char_height * ratio * 100) / 100;

    let offset = Math.floor((rows - Math.round(text_height / char_height)) / 2);

    this.setState({ center_offset: offset });
  }

  componentDidMount() {
    let image = new Image();
    image.onload = () => {
      this.setState({ text: this.addGenText(raw), image: image }, () => {
        this.setTextCenter();
        this.renderAscii(image);
      });
    };
    image.src = `/static/images/grant.png`;
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.width !== this.props.width ||
      prevProps.height !== this.props.height
    ) {
      this.setState({ text: this.addGenText(raw) }, () => {
        this.setTextCenter();
        this.renderAscii(this.state.image);
      });
    }
  }

  getLayout() {
    let { width, height, font_size, line_height, ratio } = this.props;

    width = Math.max(1400, width);

    let char_height = font_size * line_height;
    let char_width = Math.round(char_height * ratio * 100) / 100;

    let padding = char_height / 4;

    let columns = getColumnNumber(width - padding * 2, char_width);
    let rows = getRowNumber(height - padding * 2, char_height);
    let orientation, left_columns, right_columns, split_padding;
    if (columns > 0) {
      orientation = 'h';
      split_padding = 2;
      left_columns = Math.floor(columns / 2) - split_padding;
      right_columns = Math.ceil(columns / 2) - split_padding;
      rows = rows - 1;
    } else {
      split_padding = 0;
      orientation = 'v';
      left_columns = columns;
      right_columns = columns;
    }

    let grid = {
      w: columns * char_width,
      h: rows * char_height,
    };

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
      orientation,
    };
  }

  render() {
    let {
      quads,
      letters,
      pixel_letters,
      ascii,
      render_info,
      origin,
    } = this.state;
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
      orientation,
    } = this.getLayout();

    console.log(quads);

    return (
      <div
        style={{
          fontFamily: "'IBMPlexMono-Regular', 'IBM Plex Mono'",
          position: 'relative',
        }}
      >
        <canvas
          width={grid.w}
          height={grid.h}
          ref={this.backer}
          style={{
            position: 'absolute',
            width: grid.w,
            height: grid.h,
            left: padding,
            top: padding,
          }}
        />
        <canvas
          width={grid.w}
          height={grid.h}
          ref={this.quader}
          style={{
            position: 'absolute',
            width: grid.w,
            height: grid.h,
            left: padding,
            top: padding,
          }}
        />

        <canvas
          width={grid.w}
          height={grid.h}
          ref={this.highlighter}
          style={{
            position: 'absolute',
            width: grid.w,
            height: grid.h,
            left: padding,
            top: padding,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: grid.w,
            height: grid.h + char_height,
            left: padding,
            top: padding,
            display: orientation === 'h' ? 'flex' : 'block',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: left_columns * char_width,
              height:
                orientation === 'h'
                  ? rows * char_height
                  : box.h * char_height + char_height * 1,
              position: 'relative',
            }}
          >
            {ascii !== null ? (
              <div
                style={{
                  position: 'absolute',
                  left: box.x * char_width,
                  top: orientation === 'h' ? box.y * char_height : 0,
                  width: box.w * char_width + 1,
                  height: box.h * char_height,
                  whiteSpace: 'pre',
                  cursor: 'none',
                }}
                dangerouslySetInnerHTML={{ __html: ascii }}
              />
            ) : null}
          </div>
          <div
            style={{
              width: right_columns * char_width,
              height: orientation === 'v' ? 'auto' : rows * char_height,
              marginLeft:
                orientation === 'h' ? char_width * split_padding * 2 : 0,
              paddingTop:
                orientation === 'h'
                  ? this.state.center_offset * char_height
                  : 0,
              paddingBottom: orientation === 'v' ? char_height : 0,
              boxSizing: 'border-box',
            }}
          >
            <div ref={this.textRef}>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  maxWidth: char_width * 70 + 1,
                }}
                dangerouslySetInnerHTML={{
                  __html: indexExcludeLinks(linkify(this.state.text)),
                }}
              />
              {this.state.text !== null && this.state.quads !== null ? (
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    maxWidth: char_width * 70 + 1,
                    color: '#888',
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      `\n` +
                      linkify(
                        `> The ${
                          this.state.text.length
                        } characters from the description text are placed within the ${
                          this.state.quads.length
                        } pixels rescaled from an image of my face. Read more about how it works at ${
                          window.location.href
                        }source`
                      ) +
                      '.',
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Style(Index);
