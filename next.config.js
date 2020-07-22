const withPlugins = require('next-compose-plugins');
// const withReactSvg = require('next-react-svg');

const nextConfig = {
    webpack: (config) => {
        config.node = {
            fs: 'empty'
        }
        return config
    }
};

module.exports = withPlugins([], nextConfig);