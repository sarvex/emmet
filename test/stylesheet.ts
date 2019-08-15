import { strictEqual as equal } from 'assert';
import { stylesheet as expandAbbreviation, parseStylesheetSnippets, resolveConfig } from '../src';

const defaultConfig = resolveConfig({
    type: 'stylesheet',
    options: {
        'output.field': (index, placeholder) => `\${${index}${placeholder ? ':' + placeholder : ''}}`
    },
    snippets: {
        mten: 'margin: 10px;'
    }
});
const snippets = parseStylesheetSnippets(defaultConfig.snippets);

function expand(abbr: string, config = defaultConfig) {
    return expandAbbreviation(abbr, config, snippets);
}

describe('Stylesheet abbreviations', () => {
    it('keywords', () => {
        equal(expand('bd1-s'), 'border: 1px solid;');
        equal(expand('dib'), 'display: inline-block;');
        equal(expand('bxsz'), 'box-sizing: ${1:border-box};');
        equal(expand('bxz'), 'box-sizing: ${1:border-box};');
        equal(expand('bxzc'), 'box-sizing: content-box;');
        equal(expand('fl'), 'float: ${1:left};');
        equal(expand('fll'), 'float: left;');

        equal(expand('pos'), 'position: ${1:relative};');
        equal(expand('poa'), 'position: absolute;');
        equal(expand('por'), 'position: relative;');
        equal(expand('pof'), 'position: fixed;');
        equal(expand('pos-a'), 'position: absolute;');

        equal(expand('m'), 'margin: ${0};');
        equal(expand('m0'), 'margin: 0;');

        // use `auto` as global keyword
        equal(expand('m0-a'), 'margin: 0 auto;');
        equal(expand('m-a'), 'margin: auto;');

        equal(expand('bg'), 'background: ${1:#000};');

        equal(expand('bd'), 'border: ${1:1px} ${2:solid} ${3:#000};');
        equal(expand('bd0-s#fc0'), 'border: 0 solid #fc0;');
        equal(expand('bd0-dd#fc0'), 'border: 0 dot-dash #fc0;');
        equal(expand('bd0-h#fc0'), 'border: 0 hidden #fc0;');

        equal(expand('trf-trs'), 'transform: translate(${1:x}, ${2:y});');
    });

    it('numeric', () => {
        equal(expand('p0'), 'padding: 0;', 'No unit for 0');
        equal(expand('p10'), 'padding: 10px;', '`px` unit for integers');
        equal(expand('p.4'), 'padding: 0.4em;', '`em` for floats');
        equal(expand('p10p'), 'padding: 10%;', 'unit alias');
        equal(expand('z10'), 'z-index: 10;', 'Unitless property');
        equal(expand('p10r'), 'padding: 10rem;', 'unit alias');
        equal(expand('mten'), 'margin: ${1:10px};', 'Ignore terminating `;` in snippet');
    });

    it('numeric with format options', () => {
        const config = resolveConfig({
            options: {
                'stylesheet.intUnit': 'pt',
                'stylesheet.floatUnit': 'vh',
                'stylesheet.unitAliases': {
                    e: 'em',
                    p: '%',
                    x: 'ex',
                    r: ' / @rem'
                }
            }
        });
        equal(expand('p0', config), 'padding: 0;', 'No unit for 0');
        equal(expand('p10', config), 'padding: 10pt;', '`pt` unit for integers');
        equal(expand('p.4', config), 'padding: 0.4vh;', '`vh` for floats');
        equal(expand('p10p', config), 'padding: 10%;', 'unit alias');
        equal(expand('z10', config), 'z-index: 10;', 'Unitless property');
        equal(expand('p10r', config), 'padding: 10 / @rem;', 'unit alias');
    });

    it('important', () => {
        equal(expand('!'), '!important');
        equal(expand('p!'), 'padding: ${0} !important;');
        equal(expand('p0!'), 'padding: 0 !important;');
    });

    it('snippets', () => {
        equal(expand('@k'), '@keyframes ${1:identifier} {\n\t${2}\n}');
    });

    it('multiple properties', () => {
        equal(expand('p10+m10-20'), 'padding: 10px;\nmargin: 10px 20px;');
        equal(expand('p+bd'), 'padding: ${0};\nborder: ${1:1px} ${2:solid} ${3:#000};');
    });

    it('functions', () => {
        equal(expand('trf-s(2)'), 'transform: scale(2, ${2:y});');
        equal(expand('trf-s(2, 3)'), 'transform: scale(2, 3);');
    });

    it('case insensitive matches', () => {
        equal(expand('trf:rx'), 'transform: rotateX(${1:angle});');
    });

    it('use min score when finding best match for snippets', () => {
        equal(expand('auto', resolveConfig({ options: { 'stylesheet.fuzzySearchMinScore': 0 } })), 'align-self: unset;');
        equal(expand('auto', resolveConfig({ options: { 'stylesheet.fuzzySearchMinScore': 0.3 } })), 'auto: ;');
    });
});
