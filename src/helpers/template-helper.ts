import _ from 'lodash';
import beautify from 'js-beautify';
import assetHelper from './asset-helper';

export default {
  render(
    path: string,
    locals: Record<string, unknown>,
    options?: beautify.CoreBeautifyOptions & { beautify: boolean }
  ) {
    options = _.assign(
      {
        beautify: true,
        indent_size: 2,
        preserve_newlines: false,
      },
      options || {}
    );

    const template = assetHelper.read(path);
    let content = _.template(template)(locals || {});

    if (options.beautify) {
      content = beautify(content, options);
    }

    return content;
  },
};
