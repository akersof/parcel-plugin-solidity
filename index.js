//Apparently this is a plugin, it needs to be linked to an asset
module.exports = function (bundler) {
    bundler.addAssetType('sol', require.resolve('./SolidityAsset.js'));
};