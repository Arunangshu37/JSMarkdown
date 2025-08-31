const textArea = document.getElementById('textArea');
        const markdownDisplay = document.getElementById('markdownDisplay');

        textArea.addEventListener('keyup', (event) => {
            
            parseTextToMarkdown(textArea.value);
            // console.log(textArea.value, event.key);
        });
        const headingTokens = ['#', '##', '###', '####', '#####'];
        const boldRegex = /\*(.?)\*/gm;

        function parseTextToMarkdown(value) {
            // let's break the text on the basis of '\n'
            let sentences = value.split('\n');
            
            sentences = sentences.map(v => v.concat('<br />'));
            let codeBlockMap = {};
            for (let index = 0; index < sentences.length; index++) {
                let firstToken = sentences[index].split(' ')[0];
                // handle heading
                if (sentences[index].startsWith('#')) {
                    if (headingTokens.includes(firstToken)) {
                        const [openingTag, closingTag, sentenceStartIndex] = getHTMLTagsForHeading(firstToken);
                        let newSentence = `${openingTag} ${sentences[index].substring(sentenceStartIndex)} ${closingTag}`;
                        sentences[index] = newSentence;
                    }
                    continue;
                }

                // Handle unordered list
                if (sentences[index].startsWith('- ')) {
                    let newSentence = `<li> ${sentences[index].substring(2)} </li>`;
                    sentences[index] = newSentence;
                }

                // handle bold phrases
                let allBoldPhrases = sentences[index].match(/\*(.*?)\*/gm);
                if (allBoldPhrases) {
                    let newSentence = sentences[index];
                    for (let boldPhrase of allBoldPhrases) {
                        newSentence = newSentence.replace(boldPhrase, `<b>${boldPhrase.substring(1, (boldPhrase.length - 1))}</b>`);
                    }
                    sentences[index] = newSentence;
                }

                // handle italics phrases
                let allItalicsPhrases = sentences[index].match(/_(.*?)_/gm);
                if (allItalicsPhrases) {
                    let newSentence = sentences[index];
                    for (let italicsPhrase of allItalicsPhrases) {
                        newSentence = newSentence.replace(italicsPhrase, `<i>${italicsPhrase.substring(1, (italicsPhrase.length - 1))}</i>`);
                    }
                    sentences[index] = newSentence;
                }

                // handle code block phrases
                let phraseInsideCodeBlock = sentences[index].match(/\`(.*?)\`/gm);
                if (phraseInsideCodeBlock && phraseInsideCodeBlock.length > 0) {
                    let newSentence = sentences[index];
                    for (let codeBlockPhrase of phraseInsideCodeBlock) {
                        let codeBlockId = new Date().getTime().toString() + (Math.random()*10000).toString().substring(0,4);
                        codeBlockMap = { ...codeBlockMap, [codeBlockId]: getCodeFormattedText(codeBlockPhrase.substring(1, (codeBlockPhrase.length - 1))) }
                        newSentence = newSentence.replace(codeBlockPhrase, `<code data-highlighted="yes" id='${codeBlockId}'></code>`);
                    }
                    sentences[index] = newSentence;
                }
               
                // handle linked phrases
                let candidatesForLinkedPhrases = sentences[index].match(/\[(.*?)\]\((.*?)\)/gm);
                if (candidatesForLinkedPhrases) {
                    let newSentence = sentences[index];
                    for (let linkedPhrase of candidatesForLinkedPhrases) {
                        let [onlyPartInsideSquareBraces, onlyPartInsideRoundBraces ] = ['', linkedPhrase.match(/\((.*?)\)/gm)[0]];
                        // first check if there is any more occurrences of [] in the phrase
                        const partsInsideSquareBraces = linkedPhrase.match(/\[(.*?)\]/gm);
                        if(partsInsideSquareBraces && partsInsideSquareBraces.length > 1) {
                            // last one should be link rest all will be dummy
                            onlyPartInsideSquareBraces = partsInsideSquareBraces[partsInsideSquareBraces.length - 1];
                            linkedPhrase = onlyPartInsideSquareBraces + onlyPartInsideRoundBraces;
                        }
                        else {
                            onlyPartInsideSquareBraces = linkedPhrase.match(/\[(.*?)\]/gm)[0];
                        }
                        let href = `<a href='${onlyPartInsideRoundBraces.substring(1, (onlyPartInsideRoundBraces.length - 1))}' target="_blank">${onlyPartInsideSquareBraces.substring(1, (onlyPartInsideSquareBraces.length - 1))}</a>`;
                        newSentence = newSentence.replace(linkedPhrase, href);
                    }
                    sentences[index] = newSentence;
                }

                // handle image linked phrases
                let candidatesForImageLinkedPhrases = sentences[index].match(/\!\[image\]\((.*?)\)/gm);
                if (candidatesForImageLinkedPhrases) {
                    let newSentence = sentences[index];
                    for (let imageLinkedPhrase of candidatesForImageLinkedPhrases) {
                        let [onlyPartInsideSquareBraces, onlyPartInsideRoundBraces ] = ['', imageLinkedPhrase.match(/\((.*?)\)/gm)[0]];
                        // first check if there is any more occurrences of ![image] in the phrase
                        const partsInsideSquareBraces = imageLinkedPhrase.match(/\!\[image\]/gm);
                        if(partsInsideSquareBraces && partsInsideSquareBraces.length > 1) {
                            // last one should be an image rest all will be dummy
                            onlyPartInsideSquareBraces = partsInsideSquareBraces[partsInsideSquareBraces.length - 1];
                            imageLinkedPhrase = onlyPartInsideSquareBraces + onlyPartInsideRoundBraces;
                        }
                        else {
                            onlyPartInsideSquareBraces = imageLinkedPhrase.match(/\!\[image\]/gm)[0];
                        }
                        let img = `<img style='width: 100%; height: auto' src='${onlyPartInsideRoundBraces.substring(1, (onlyPartInsideRoundBraces.length - 1))}' alt='${onlyPartInsideSquareBraces.substring(1, (onlyPartInsideSquareBraces.length - 1))}' />`;
                        newSentence = newSentence.replace(imageLinkedPhrase, img);
                    }
                    sentences[index] = newSentence;
                }
               
            }
            markdownDisplay.innerHTML = sentences.join(' ');
            Object.keys(codeBlockMap).forEach(id => {
                const codeElement = document.getElementById(id);
                if (codeElement) {
                    codeElement.innerHTML = codeBlockMap[id];
                }
            });
        }

        // utility functions
        function getHTMLTagsForHeading(token) {
            switch (token) {
                case '#':
                    return ['<h1>', '</h1>', 2];
                case '##':
                    return ['<h2>', '</h2>', 3];
                case '###':
                    return ['<h3>', '</h3>', 4];
                case '####':
                    return ['<h4>', '</h4>', 5];
                case '#####':
                    return ['<h5>', '</h5>', 6];
                default:
                    return []
            }
        }

        function getCodeFormattedText(text) {
            let antiHTMLText = text.replaceAll('<', '&lt;');
            antiHTMLText = antiHTMLText.replaceAll('>', '&gt;');
            console.log(antiHTMLText);
            return antiHTMLText;
        }

        // Tests
        // sunny side up scenario
        let val = `
## My heading
Some normal text and we have some *bold text after _that*  the line_ does not ends here though. Still we have some words before the line actually breaks
and we start an _italic phrases._ We should not consider - or # when they are in between sentences and only consider them when they are on the new line 


- I Wonder how challenging this could get. All this is possible [due] to [google](https://www.google.com/) ✌️. 
- Bulleted points and then numbered points and quotations all could really get messy soon
`;
        // parseTextToMarkdown(val);
// val=' Image with `![image](link)` and this one `<h2>something crazy</h2>` ![image] [link](https://www.google.com) ![link] (https://www.google.com) ![image](https://i.postimg.cc/0Np34PnL/code-journal.jpg)';
// parseTextToMarkdown(val)