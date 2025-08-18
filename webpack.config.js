const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        'content-scripts/amazon-orders': './src/content-scripts/amazon-orders.js',
        'content-scripts/amazon-orders-early': './src/content-scripts/amazon-orders-early.js',
        'background/background': './src/background/background.js',
        'popup/popup': './src/popup/popup.js',
        'utils/google-sheets-api': './src/utils/google-sheets-api.js',
        'utils/order-parser': './src/utils/order-parser.js',
        'utils/storage': './src/utils/storage.js',
        'utils/dom-manipulator': './src/utils/dom-manipulator.js',
        'components/tagging-dialog': './src/components/tagging-dialog.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    optimization: {
        // Disable code splitting to prevent chunk loading issues in extensions
        splitChunks: false,
        runtimeChunk: false
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'src/popup/popup.html', to: 'popup/popup.html' },
                { from: 'src/popup/popup.css', to: 'popup/popup.css' },
                { from: 'src/content-scripts/amazon-orders.css', to: 'content-scripts/amazon-orders.css' },
                { from: 'src/content-scripts/amazon-orders-early.css', to: 'content-scripts/amazon-orders-early.css' },
                { from: 'src/components/tagging-dialog.html', to: 'components/tagging-dialog.html' },
                { from: 'src/components/tagging-dialog.css', to: 'components/tagging-dialog.css' },
                { from: 'icons', to: 'icons' }
            ]
        })
    ],
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.css']
    }
};
