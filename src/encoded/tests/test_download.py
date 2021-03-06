import pytest

RED_DOT = """data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA
AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO
9TXL0Y4OHwAAAABJRU5ErkJggg=="""

BLUE_DOT = """data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA
oAAAAKAQMAAAC3/F3+AAAACXBIWXMAAA7DAAAOwwHHb6hkAA
AAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQ
AAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPA
AAAANQTFRFALfvPEv6TAAAAAtJREFUCB1jYMAHAAAeAAEBGN
laAAAAAElFTkSuQmCC"""


@pytest.fixture
def testing_download(testapp):
    url = '/testing-downloads/'
    item = {'document': {
        'download': 'red-dot.png',
        'href': RED_DOT,
    }}
    res = testapp.post_json(url, item, status=201)
    return res.location


def test_download_create(testapp, testing_download):
    from base64 import b64decode
    res = testapp.get(testing_download)
    assert res.json['document']['href'] == '@@download/document/red-dot.png'
    url = testing_download + '/' + res.json['document']['href']
    res = testapp.get(url)
    assert res.content_type == 'image/png'
    assert res.body == b64decode(RED_DOT.split(',', 1)[1])


def test_download_update(testapp, testing_download):
    from base64 import b64decode
    item = {'document': {
        'download': 'blue-dot.png',
        'href': BLUE_DOT,
    }}
    testapp.post_json(testing_download, item, status=200)
    res = testapp.get(testing_download)
    assert res.json['document']['href'] == '@@download/document/blue-dot.png'
    url = testing_download + '/' + res.json['document']['href']
    res = testapp.get(url)
    assert res.content_type == 'image/png'
    assert res.body == b64decode(BLUE_DOT.split(',', 1)[1])


def test_download_update_no_change(testapp, testing_download):
    item = {'document': {
        'download': 'red-dot.png',
        'href': '@@download/document/red-dot.png',
    }}
    testapp.post_json(testing_download, item, status=200)


@pytest.mark.parametrize(
    'href',
    [
        '@@download/document/another.png',
        'http://example.com/another.png',
    ])
def test_download_update_bad_change(testapp, testing_download, href):
    item = {'document': {
        'download': 'red-dot.png',
        'href': href,
    }}
    testapp.post_json(testing_download, item, status=422)


@pytest.mark.parametrize(
    'href',
    [
        '@@download/document/another.png',
        'http://example.com/another.png',
    ])
def test_download_create_bad_change(testapp, href):
    url = '/testing-downloads/'
    item = {'document': {
        'download': 'red-dot.png',
        'href': href,
    }}
    testapp.post_json(url, item, status=422)
