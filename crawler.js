const axios = require('axios');
axios.defaults.withCredentials = true;
const cheerio = require('cheerio');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Updated Vietnamese phone number regex to handle non-digit separators
const vietnamCellphoneRegex = /(?:\+84|0)[ .]?(\d[ .]?){9,10}/;

//Land Line number
//const vietnamLandlineRegex = /\(\d{2,3}\)[ .]?\d{1,4}[ .]?\d{1,4}[ .]?\d{1,4}/;

// Email address regex
const emailRegex = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/;

const visitedUrls = new Set();
const phoneNumbers = new Set();
const emails = new Set();

const maxDepth = 3,// Độ sâu khi truy cập vào từng link
    resultName = 'bds',// Tên file xuất kết quả
    //startUrl = 'https://www.google.com/search?q=nha+bao+loc&oq=nha+bao+loc&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIJCAEQABgTGIAEMgoIAhAAGBMYFhgeMgwIAxAAGA8YExgWGB4yCggEEAAYExgWGB4yCggFEAAYExgWGB4yCggGEAAYExgWGB4yBggHEEUYQdIBCDM0MzBqMGo5qAIAsAIA&sourceid=chrome&ie=UTF-8';
    startUrl = 'https://www.google.com/search?q=hotline+sdt+t%E1%BA%A1i+b%E1%BA%A3o+l%E1%BB%99c+facebook&client=opera&hs=hDx&sca_esv=ecd28fb0a3f715a7&sca_upv=1&biw=1205&bih=570&sxsrf=ADLYWII0jF7xWR2LB0LV23-5jhmSDLfkag%3A1724751532671&ei=rJ7NZsLEKM7k2roPx4rV8Aw&ved=0ahUKEwjCyriT8JSIAxVOslYBHUdFFc44ZBDh1QMIDw&oq=hotline+sdt+t%E1%BA%A1i+b%E1%BA%A3o+l%E1%BB%99c+facebook&gs_lp=Egxnd3Mtd2l6LXNlcnAiJmhvdGxpbmUgc2R0IHThuqFpIGLhuqNvIGzhu5ljIGZhY2Vib29rMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHMgoQABiwAxjWBBhHSOv4BVAAWABwAXgBkAEAmAEAoAEAqgEAuAEMyAEAmAIBoAItmAMAiAYBkAYIkgcBMaAHAA&sclient=gws-wiz-serp&fbclid=IwY2xjawE6vPtleHRuA2FlbQIxMAABHbKSwXp6OiT3Yghns90yp3AXv8SJR_RVjpHuYTZB-3iCra1fTkqU963KqQ_aem_yehvyoUtCAAdOLx5t_M95w';
    // Đường dẫn cần search.

// Function to generate a timestamped filename for each data type
function getTimestampedFilePath(prefix) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-'); // Replace colon and dot for file safety
    //return path.join(__dirname, `${prefix}-${timestamp}.txt`);
    return path.join(__dirname, `${resultName}-${prefix}.txt`);
}

// Function to extract phone numbers from text
function extractPhoneNumbers(text) {
    const cellphoneMatches = text.match(vietnamCellphoneRegex);
    //const landlineMatches = text.match(vietnamLandlineRegex);
    if (cellphoneMatches) {
        cellphoneMatches.forEach(number => phoneNumbers.add(number));
    }
    /*if (landlineMatches) {
        landlineMatches.forEach(number => phoneNumbers.add(number));
    }*/
}

// Function to extract email addresses from text
function extractEmails(text) {
    const matches = text.match(emailRegex);
    if (matches) {
        matches.forEach(email => emails.add(email));
    }
}

// Function to write phone numbers to file
function writePhoneNumbersToFile() {
    const phoneNumbersArray = [...phoneNumbers];
    const data = ['Phone Numbers:', ...phoneNumbersArray].join('\n');
    const outputFilePath = getTimestampedFilePath('phones');
    fs.writeFileSync(outputFilePath, data); // Overwrites the file with new data
    //console.log(`Phone Numbers exported to ${outputFilePath}`);
}

// Function to write email addresses to file
function writeEmailsToFile() {
    const emailsArray = [...emails];
    const data = ['Email Addresses:', ...emailsArray].join('\n');
    const outputFilePath = getTimestampedFilePath('emails');
    fs.writeFileSync(outputFilePath, data); // Overwrites the file with new data
    //console.log(`Email Addresses exported to ${outputFilePath}`);
}

// Function to write visited URLs to file
function writeVisitedUrlsToFile() {
    const visitedUrlsArray = [...visitedUrls];
    const data = ['Visited URLs:', ...visitedUrlsArray].join('\n');
    const outputFilePath = getTimestampedFilePath('urls');
    fs.writeFileSync(outputFilePath, data); // Overwrites the file with new data
    //console.log(`Visited URLs exported to ${outputFilePath}`);
}

// Set up periodic file writing every 1 minute
const interval = setInterval(() => {
    writePhoneNumbersToFile();
    writeEmailsToFile();
    writeVisitedUrlsToFile();
}, 10000); // 60000 ms = 1 minute

async function crawl(url, depth) {
    if (depth > maxDepth || visitedUrls.has(url)) {
        return;
    }

    visitedUrls.add(url);
    console.log(`Crawling ${url} at depth ${depth}...`);

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);

        // Extract phone numbers and email addresses from the current page
        $('body *').each((index, element) => {
            const text = $(element).text();
            extractPhoneNumbers(text);
            extractEmails(text);
        });

       // console.log('Phone Numbers Found:', [...phoneNumbers]);
        //console.log('Email Addresses Found:', [...emails]);

        // Find and crawl links on the current page
        const links = $('a[href]').map((i, link) => $(link).attr('href')).get();
        for (let link of links) {
            const absoluteUrl = new URL(link, url).toString();
            await crawl(absoluteUrl, depth + 1);
        }

    } catch (error) {
        console.error(`Failed to crawl ${url}:`, error.message);
    }
}

crawl(startUrl, 0).then(() => {
    console.log('Crawling completed.');
    /*console.log('Extracted Phone Numbers:', [...phoneNumbers]);
    console.log('Extracted Email Addresses:', [...emails]);
    console.log('Visited URLs:', [...visitedUrls]);*/

    // Clear interval and write remaining data to files
    clearInterval(interval);
    writePhoneNumbersToFile();
    writeEmailsToFile();
    writeVisitedUrlsToFile();
});
