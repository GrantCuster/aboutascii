import _ from 'lodash';
let font = 'IBM Plex Sans';

export function linkify(text) {
  // from https://ctrlq.org/code/20294-regex-extract-links-javascript
  return (text || '').replace(
    /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+)) /gi,
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
        '</a>' +
        ` `
      );
    }
  );
}

export function displayText(text) {
  let linked = (text || '').replace(
    /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
    function(match, space, url) {
      var hyperlink = url;
      return space + `<link>${url}<link>` + ` `;
    }
  );
  let splits = linked.split('<link>').map(t => {
    return t.startsWith('http')
      ? { node: 'link', content: t }
      : { node: 'text', content: t };
  });

  let counter = 0;
  for (let i = 0; i < splits.length; i++) {
    let split = splits[i];
    let letters_raw = split.content.split('');
    let letters_indexed = [];
    for (let j = 0; j < split.content.length; j++) {
      let letter = letters_raw[j];
      letters_indexed.push([letter, counter]);
      counter++;
    }
    split.content = letters_indexed;
  }

  return splits;
}

export function wrapCharacters(element) {
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

export function indexExcludeLinks(text) {
  let wrap = document.createElement('div');
  wrap.innerHTML = text;
  // mutates
  wrapCharacters(wrap);
  return wrap.innerHTML;
}

export function getColumnNumber(width, c_width) {
  let columns = Math.floor(width / c_width);
  return columns;
}

export function getRowNumber(height, r_height) {
  return Math.floor(height / r_height);
}

export function contain(c, r, aspect) {
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

export function getQuads(box, image) {
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

export function getLetters(text, style) {
  let { font_size, line_height, ratio } = style;

  // let letters = text.replace(/\n/g, ' ').split('');
  let letters = text.split('');
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
      index: i,
    };
  });

  return letter_percents;
}

export function getDistance(a, b) {
  // from https://developer.hyvor.com/js-euclidean-distance
  return (
    a
      .map((x, i) => Math.abs(x - b[i]) ** 2) // square the difference
      .reduce((sum, now) => sum + now) ** // sum
    (1 / 2)
  );
}

export function getLayout(width, height, font_size, line_height, ratio) {
  // width = Math.max(1400, width);

  let fheight = font_size * line_height;
  let fwidth = Math.round(fheight * ratio * 100) / 100;

  let padding = fheight / 4;

  let columns = getColumnNumber(width - padding * 2, fwidth);
  let rows = getRowNumber(height - padding * 2, fheight);
  let orientation, left_columns, right_columns, split_padding;

  let min_art = 60;

  if (columns > 108) {
    orientation = 'h';
    split_padding = 2;
    left_columns = Math.floor(columns / 2) - split_padding;
    right_columns = Math.ceil(columns / 2) - split_padding;
    rows = rows - 1;
  } else {
    split_padding = 0;
    orientation = 'v';
    left_columns = Math.max(columns, min_art);
    right_columns = columns;
  }

  return {
    fheight,
    fwidth,
    padding,
    columns,
    rows,
    left_columns,
    right_columns,
    orientation,
  };
}

export let requestInterval = function(fn, delay) {
  // from https://css-tricks.com/snippets/javascript/replacements-setinterval-using-requestanimationframe/
  var requestAnimFrame = (function() {
      return (
        window.requestAnimationFrame ||
        function(callback, element) {
          window.setTimeout(callback, 1000 / 60);
        }
      );
    })(),
    start = new Date().getTime(),
    handle = {};
  function loop() {
    handle.value = requestAnimFrame(loop);
    var current = new Date().getTime(),
      delta = current - start;
    if (delta >= delay) {
      fn.call();
      start = new Date().getTime();
    }
  }
  handle.value = requestAnimFrame(loop);
  return handle;
};
