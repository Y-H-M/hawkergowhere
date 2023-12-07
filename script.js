document.addEventListener('DOMContentLoaded', function() {

    // Update the headers & footers, then set cookies for a new visitor and setup dark mode
    Promise.all([uploadHeader(), uploadFooter()]).then(() => {
        newVisitor();
        darkMode();
    });

    // Run JS code for each page
    if (window.location.pathname.includes('/home.html')) {
        searchLocation();
    } else if (window.location.pathname.includes('/search.html')) {
        processSearch();
        saveItem();
    } else if (window.location.pathname.includes('/saved.html')) {
        loadSave();
        saveItem();
    }
});

import hawkersData from './hawkers.json'assert {type: 'json'};

// Upload header into page
const uploadHeader = () => {
    return fetch('header.html')
        .then(response => {
            return response.text();
        })
        .then(htmlContent => {
            document.getElementsByTagName('header')[0].innerHTML = htmlContent;
        });
};

// Upload footer into page
const uploadFooter = () => {
    return fetch('footer.html')
        .then(response => {
            return response.text();
        })
        .then(htmlContent => {
            document.getElementsByTagName('footer')[0].innerHTML = htmlContent;
            document.getElementById('year').innerHTML = new Date().getFullYear();
        });
};

// Submit form with user's location
const searchLocation = () => {
    document.getElementById('locationsearch').addEventListener('submit', function(event) {
        event.preventDefault();

        const latInput = document.getElementById('lat');
        const longInput = document.getElementById('long');

        navigator.geolocation.getCurrentPosition(function(position) {
            latInput.value = position.coords.latitude;
            longInput.value = position.coords.longitude;
            event.target.submit();
        });
    });
};

// Set cookies for new user
const newVisitor = () => {
    let visited = parseInt(getCookies()['visited']);
    if (!visited) {
        for (let i = 0; i < hawkersData.length; i++) {
            setCookie(i + 1, 0);
        }
        setCookie('visited', 1);
        setCookie('dark', 0);
    }
};

// Toggle dark mode
const darkMode = () => {
    let cookies = getCookies();
    let button = document.getElementById('Dark-Mode');
    button.innerHTML = `<i class="fa-solid fa-sun"></i>`;
    if (parseInt(cookies['dark'])) {
        document.body.classList.toggle('darkMode');
        button.innerHTML = `<i class="fa-solid fa-moon"></i>`;
    }
    button.addEventListener('click', () => {
        let cookies = getCookies();
        let newStatus = parseInt(cookies['dark'])? 0: 1;
        setCookie('dark', newStatus);
        button.innerHTML = newStatus? `<i class="fa-solid fa-moon"></i>` : `<i class="fa-solid fa-sun"></i>`;
        document.body.classList.toggle('darkMode');
    });
};

// Calling different function for method of searching
const processSearch = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('keyword')) {
        const keyword = urlParams.get('keyword');
        console.log(keyword);
        processKeywordSearch(keyword);
    } else if (urlParams.has('lat') && urlParams.has('long')) {
        const lat = urlParams.get('lat');
        const long = urlParams.get('long');
        console.log(lat, long);
        processLocationSearch(lat, long);
    } else {
        window.location.assign('/hawkergowhere/home.html');
    }
};

// Process search via keywords using keyword match
const processKeywordSearch = (keyword) => {
    const results = document.getElementById('results');
    let resultList = [];
    for (let hawker of hawkersData) {
        if (keywordMatch(keyword, hawker['NAME'])) {
            resultList.push(hawker);
        } else if (keywordMatch(keyword, hawker['ADDRESS'])) {
            resultList.push(hawker);
        }
    }
    let resultHtml = '';
    if (resultList.length === 0) {
        resultHtml = ':( No hawkers found.';
    } else {
        for (let hawker of resultList) {
            let html = hawkerHtmlFormat(hawker);
            resultHtml += html;
        }
        resultHtml += `<p>You've reached the end of the search results.</p>`;
    }
    results.innerHTML = resultHtml;
    let searchBar = document.getElementById('search-bar');
    searchBar.value = keyword;
};

// Process search via location for hawkers in vicinity
const processLocationSearch = (lat, long) => {
    const results = document.getElementById('results');
    let resultList = [];
    for (let hawker of hawkersData) {
        let distance = calculateDistance(lat, long, hawker['LATITUDE'], hawker['LONGITUDE']);
        hawker['distance'] = distance;
        if (distance < 5) {
            resultList.push(hawker);
        }
    }
    let resultHtml = '';
    if (resultList.length === 0) {
        resultHtml = ':( No hawkers found.';
    } else {
        for (let hawker of resultList) {
            let html = hawkerHtmlFormat(hawker);
            resultHtml += html;
        }
        resultHtml += `<p>You've reached the end of the search results.</p>`;
    }
    results.innerHTML = resultHtml;
};

// Check if the query is in text.
const keywordMatch = (query, text) => {
    return text.toLowerCase().includes(query.toLowerCase());
};

// Calculate distance in km between 2 points marked with lat long
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    let R = 6371;
    let dLat = deg2rad(lat2 - lat1);
    let dLon = deg2rad(lon2 - lon1);
    let a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    return d;
};
const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// Process hawker format of a div for HTML
const hawkerHtmlFormat = (hawker) => {
    let url = `https://www.google.com/maps/place/Singapore+${hawker['POSTAL']}/`;
    let saveIcon = ''
    let saved = false;
    let cookies = document.cookie.split(';');
    let id = hawker['ID']
    let distance = '';
    if (hawker['distance']) {
        distance = `${hawker['distance'].toFixed(2)}km away<br>`;
    }
    saved = parseInt(getCookies()[id]);
    if (saved) {
        saveIcon = '<i class="fa-solid fa-bookmark"></i>'
    } else {
        saveIcon = '<i class="fa-regular fa-bookmark"></i>'
    }
    let html = `<div id="hawker">
    <div id="details">
        <h1>${hawker['NAME']}</h1>${hawker['ADDRESS']}<br>${distance}<a href='${url}' target='_blank'>Google Maps</a><div class="saveButton"><button type="button" class="save" hawkerId=${hawker['ID']}>${saveIcon}</button></div></div><div id="map">${hawker['DIV']}</div></div>`;
    return html;
};

// Save a hawker into user's cookies
const saveItem = () => {
    let buttons = document.querySelectorAll('.save');
    buttons.forEach(function(button) {
        button.addEventListener('click', () => {
            let id = button.getAttribute('hawkerId');
            let saved = 0;
            saved = parseInt(getCookies()[id]);
            saved = saved ? 0 : 1;
            button.innerHTML = saved ? '<i class="fa-solid fa-bookmark"></i>' : '<i class="fa-regular fa-bookmark"></i>';
            setCookie(id, saved);
            if (window.location.pathname.startsWith('/saved.html')) {
                location.reload()
            }
        });
    });
};

// Load saved hawkers from cookies
const loadSave = () => {
    const results = document.getElementById('results');
    let cookies = getCookies();
    let resultList = [];
    for (let hawker of hawkersData) {
        if (parseInt(cookies[hawker['ID']])) {
            resultList.push(hawker);
        }
    }
    let resultHtml = '';
    if (resultList.length === 0) {
        resultHtml = 'You have not saved any hawkers yet.';
    } else {
        resultHtml += `<h1>Saved hawkers</h1>`
        for (let hawker of resultList) {
            let html = hawkerHtmlFormat(hawker);
            resultHtml += html;
        }
        resultHtml += `That's all the hawkers you've saved!`;
    }
    results.innerHTML = resultHtml;
};

// Output JSON of cookies
const getCookies = () => {
    let cookieString = document.cookie;
    let cookieArray = cookieString.split(';');
    let cookies = {};

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        let parts = cookie.split('=');
        let name = parts[0];
        let value = parts[1];
        cookies[name] = value;
    }
    return cookies;
};

// Input cookies
const setCookie = (name, value) => {
    let cookieString = `${name}=${value};path=/`;
    document.cookie = cookieString;
}
