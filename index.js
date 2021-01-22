
const request = require('request');
const axios = require('axios');
const APIkey = "dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf";


function getFileFromServer() {
    request('http://norvig.com/big.txt', (err, res, body) => {
        if (err) {
            console.log(err);
        }
        console.log(res);
        var fileContents = body;
        getUniqueWordAndFrequency(fileContents, 10).then(function (outputJson) {
            console.log(JSON.stringify(outputJson));
        }, function (err) {
            console.error(err);
        });

    }, function (err) {
        console.error(err);
    });
}

async function getFileFromServerAxios() {
    try {
        axios.defaults.baseURL = 'http://www.norvig.com';
        axios.defaults.headers.post['Content-Type'] ='text/plain';
        axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
        const fileContents = await axios.get('/big.txt');
        getUniqueWordAndFrequency(fileContents, 10).then(function (outputJson) {
            console.log(JSON.stringify(outputJson));
        }, function (err) {
            console.error(err);
        });
    } catch (error) {
      console.error(error);
    }
  }

  function getWordDetails(wordElement) {
    return new Promise(function (resolve, reject) {
        const fileContents = await axios.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' + APIkey + '&lang=en-en&text=' + wordElement);
        request('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' + APIkey + '&lang=en-en&text=' + wordElement, (err, res, body) => {
            if (err) {
                reject(err);
            }
            resolve(body);
        });
    });
}

function getUniqueWordAndFrequency(string, cutOff) {
    return new Promise(function (resolve, reject) {
        var cleanString = string.replace(/[.,-/#!$%^&*;:{}=\-_`~()]/g, ""),
            words = cleanString.split(' '),
            frequencies = {},
            word, i;

        //to filter all empty elements from the array
        words = words.filter(entry => /\S/.test(entry));

        for (i = 0; i < words.length; i++) {
            word = words[i];
            frequencies[word] = frequencies[word] || 0;
            frequencies[word]++;
        }

        words = Object.keys(frequencies);

        var topWordArray = words.sort(function (a, b) {
            return frequencies[b] - frequencies[a];
        }).slice(0, cutOff);

        var returnArray = [];
        var apisToBeCalled = topWordArray.length;
        topWordArray.forEach(word => {
            var wordDetailsApi = getWordDetails(word);
            wordDetailsApi.then(function (wordDetails) {
                wordDetails = JSON.parse(wordDetails);
                var returnJsonObject = {
                    "count": frequencies[word]
                };
                if (wordDetails.def[0]) {
                    if ("syn" in wordDetails.def[0]) {
                        returnJsonObject.synonyms = wordDetails.def[0].syn;
                    } else {
                        if ("mean" in wordDetails.def[0]) {
                            returnJsonObject.synonyms = wordDetails.def[0].mean;
                        } else {
                            returnJsonObject.synonyms = "No Synonyms found";
                        }
                    }
                    if ("pos" in wordDetails.def[0]) {
                        returnJsonObject.pos = wordDetails.def[0].pos;
                    } else {
                        returnJsonObject.pos = "No Part of speech found";
                    }
                } else {
                    returnJsonObject.synonyms = "No Synonyms found";
                    returnJsonObject.pos = "No Part of speech found";
                }

                returnArray.push({
                    "word": word,
                    "output": returnJsonObject
                });
                apisToBeCalled--;
                if (apisToBeCalled === 0) {
                    returnArray = returnArray.sort(function (a, b) {
                        return b.output.count - a.output.count
                    })
                    var returnJson = {
                        "topwords": returnArray
                    };
                    resolve(returnJson);
                }
            }, function (err) {
                console.error(err);
                reject(err);
            });
        });
    });
}


  getFileFromServerAxios();