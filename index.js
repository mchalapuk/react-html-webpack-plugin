const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

const React = require('react');
const ReactDOMServer = require('react-dom/server');

const evaluate = require('eval');

function ReactHtmlPlugin(options) {
  this.options = {
    component: options.component,
    output: options.output || 'index.html',
    props: options.props || {},
    globals: options.globals || {},
  };
  this.entryName = `${options.component}.entry.src`;
}

ReactHtmlPlugin.prototype.apply = function(compiler) {
  compiler.apply(new SingleEntryPlugin(
    this.context,
    this.options.component,
    this.entryName
  ));

  const that = this;

  compiler.plugin('compilation', function(compilation) {
    var mainFile = compilation.outputOptions.filename || 'bundle.js';
    compilation
      .mainTemplate
      .plugin('asset-path', function (name, data) {
        if (name !== mainFile) {
          return name;
        }
        return (data.chunk && data.chunk.name === that.entryName) ? that.entryName : name;
      });
  });

  compiler.plugin('emit', function(compilation, callback) {
    const source = compilation.assets[that.entryName].source();
    const { component, globals } = that.options;

    const exports = evaluate(source, component, globals, true);
    const Root = exports.hasOwnProperty('default') ? exports.default : exports;

    let buffer;

    compilation.assets[that.options.output] = {
      source: function() {
        const element = React.createElement(Root, that.options.props);
        const markup = ReactDOMServer.renderToStaticMarkup(element);
        const html = `<!DOCTYPE html>\n${markup}`;
        buffer = Buffer.from(html, 'utf8');
        return buffer;
      },
      size: function() {
        return buffer.length;
      },
    };

    callback();
  });
};

module.exports = ReactHtmlPlugin;
module.exports.ReactHtmlPlugin = ReactHtmlPlugin;
module.exports.default = ReactHtmlPlugin;

