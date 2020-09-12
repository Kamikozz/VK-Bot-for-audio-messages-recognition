function toFormUrlEncoded(json) {
    const _arr = [];
    for (item in json) {
        _arr.push(`${item}=${encodeURIComponent(json[item])}`);
    }
    return _arr.join('&');
}

module.exports = { toFormUrlEncoded };