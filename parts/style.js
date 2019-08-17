import React from 'react';

function Style(WrappedComponent) {
  let font_size = 16;
  let line_height = 1.5;
  // TODO: compute ratio
  let ratio = Math.round(0.3999999515593998 * 100) / 100;

  return class extends React.Component {
    render() {
      // Wraps the input component in a container, without mutating it. Good!
      return (
        <div>
          <style jsx global>{`
            html {
              font-family: 'IBM Plex Mono';
              font-size: ${font_size * line_height}px;
              background: #efefef;
              word-wrap: break-word;
            }
            body {
              margin: 0;
              font-size: ${font_size}px;
              line-height: ${line_height};
            }
            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
              font-size: inherit;
              font-weight: inherit;
              margin: 0;
            }
            h1 {
              margin-bottom: 1rem;
            }
            p {
              margin: 0;
              text-indent: ${2 * ratio}rem;
              margin-bottom: 1rem;
            }
            a {
              color: inherit;
            }
            ul {
              margin: 0;
              list-style-position: inside;
              list-style: none;
              padding: 0;
              text-indent: ${2 * ratio}rem;
              margin-bottom: 1rem;
            }
            ul li:before {
              content: '- ';
            }
          `}</style>
          <WrappedComponent
            {...this.props}
            font_size={font_size}
            line_height={line_height}
            fratio={ratio}
          />
        </div>
      );
    }
  };
}

export default Style;
