$(document).ready(function () {
    // to save searchHistory in local storage
    var searchHistory = [];
    //apikey for openweather API calls
    const apiKey = "c7fc00d9bea618f9caee6c402ba7deb6";
    //event listener for search text box
    $(document).on("click", ".input-group-btn", function () {
        event.preventDefault();
        const city = $(".form-control").val().trim();
        if (city) {
            fetchAndRenderCityWeather(city);
            saveSearchHistory(city);
            renderSearchHistory();
        }
    });
    //event listener for click on search History list item
    $(document).on("click", "#city-list", function (event) {
        const element = event.target;
        if (element.matches("li")) {
            const city = $(element).text().trim();
            fetchAndRenderCityWeather(city);
            saveSearchHistory(city);
            renderSearchHistory();
        }

    });
    initSearchHistory();
    renderSearchHistory();
    if (searchHistory && searchHistory.length) {
        fetchAndRenderCityWeather(searchHistory[0]);
    }
    else {
        hideWeatherDetailPane();
    }
    /**
     * if search history persisted in local storage
     * then load it in searchHistory array.
     */
    function initSearchHistory() {
        const savedHistory = localStorage.getItem("searchHistory");
        if (savedHistory) {
            searchHistory = JSON.parse(savedHistory);
        }
    }
    /**
     * populates search list element using seachHistory array.
     */
    function renderSearchHistory() {
        $("#city-list").text("");
        $.each(searchHistory, function (index, item) {
            const listItem = $("<li></li>");
            $("#city-list").append(listItem);
            listItem.text(String.fromCharCode(160) + item);
        });
    }

    /**
     * adds last searched city in searchHistory array if not already present 
     * in search history otherwise just move the previous stored
     * city to top of array and then persist it in local storage.
     * @param {*} city current city name looked up by user.
     */
    function saveSearchHistory(city) {
        const currentCityIndex = searchHistory.indexOf(city);
        if (currentCityIndex != -1) {
            searchHistory.splice(currentCityIndex, 1);
        }
        searchHistory.splice(0, 0, city);
        localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    }

    /**
     * calls openWeather API to get weather details using city as well as 
     * latitute and longitude.
     * Once successful response then render all details.
     * @param {current city which user has searched} city 
     */
    function fetchAndRenderCityWeather(city) {
        const currentWeatherURL = "https://api.openweathermap.org/data/2.5/weather?q="
            + city + "&appid=" + apiKey;
        $.ajax({
            url: currentWeatherURL,
            method: "GET"
        })
            .then(renderCurrentWeather);

    }
    /**
     * process open weather API response to render current day weather details.
     * @param {openweather API response once promise is resolved} response 
     */
    function renderCurrentWeather(response) {

        $("#current-day-pane").children("div").children("h3").remove();
        const h3Element = $("<h3></h3>");
        const currentDayDiv = $("#current-day-pane").children("div");
        h3Element.text(response.name);
        currentDayDiv.prepend(h3Element);
        const DateElement = $("<span></span>");
        const epoch = moment.unix(response.dt);
        DateElement.text("(" + epoch.format("DD/MM/YYYY") + ")");
        h3Element.append(DateElement);
        const imageEl = $("<img>");
        const iconURL = "https://openweathermap.org/img/wn/"
            + response.weather[0].icon + "@2x.png";
        imageEl.attr("src", iconURL);
        imageEl.attr("alt", response.weather[0].description);
        h3Element.append(imageEl);
        const tempC = parseInt(response.main.temp) - 273.15;
        $("#current-temp").text(" " + tempC.toFixed(2) + " ");
        $("#current-humidity").text(" " + response.main.humidity);
        $("#current-wind-speed").text(" " + response.wind.speed + " ");
        renderUVIndex(response.coord.lat, response.coord.lon);
        renderForecastWeather(response.coord.lat, response.coord.lon);
        showWeatherDetailPane();
    }

    /**
     * fetches and render current day uv index using open weather API
     * @param {latitude of current city} lat 
     * @param {longitude of current city} lon 
     */
    function renderUVIndex(lat, lon) {
        const uvURL = "https://api.openweathermap.org/data/2.5/uvi?appid="
            + apiKey + "&lat=" + lat + "&lon=" + lon;
        $.ajax({
            url: uvURL,
            method: "GET"
        })
            .then(function (uvResponse) {
                $("#current-uv-index").text(uvResponse.value);
                const uvi = parseInt(uvResponse.value);
                if (uvi < 3) {
                    resetUVIndexColor("favorable");
                }
                else if (uvi < 6) {
                    resetUVIndexColor("moderate");
                }
                else {
                    resetUVIndexColor("severe");
                }
            });
    }
    /**
     * associates input class with uv index element so that it reflects 
     * appropriate color. green is for favorable, yellow for moderate and
     * red for severe.
     * @param {current class to be assocaited with uv index} colorClass 
     */
    function resetUVIndexColor(colorClass) {
        $("#current-uv-index").removeClass("favorable");
        $("#current-uv-index").removeClass("moderate");
        $("#current-uv-index").removeClass("severe");
        $("#current-uv-index").addClass(colorClass);
    }

    /**
     * fetches forecasted weather details using lat and lon 
     * of current city and weather API and then render same.
     * @param {latitude of current city} lat 
     * @param {longitude of current city} lon 
     */
    function renderForecastWeather(lat, lon) {

        const forecastURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" +
            lat + "&lon=" + lon + "&exclude={current,minutely,hourly}" +
            "&appid=" + apiKey;
        $.ajax({
            url: forecastURL,
            method: "GET"
        })
            .then(function (forecastResponse) {
                emptyForeCastCards();
                var date = parseInt(moment().format("DD")) + 1;
                var count = 1;
                $.each(forecastResponse.daily, function (index, item) {
                    if (count <= 5 && date == moment.unix(item.dt).format("DD")) {
                        renderforecastDate(item, count);
                        count++;
                        date++;
                    }

                });

            });

    }
    /**
     * populates forecast-day pane with relevant html elements and their values
     * @param {weather API response key daily array element} item 
     * @param {future date count whose data need to be rendered} count 
     */
    function renderforecastDate(item, count) {
        const dayEl = $("#forecast-day" + count).children("div.card-body");
        const iconURL = "https://openweathermap.org/img/wn/"
            + item.weather[0].icon + "@2x.png";
        dayEl.append($("<h5></h5>").text(String.fromCharCode(160) +
            moment.unix(item.dt).format("DD/MM/YYYY")))
        const imageEl = $("<img>");
        imageEl.attr("src", iconURL);
        imageEl.attr("alt", "weather icon");
        imageEl.addClass("forcast-card-image");
        dayEl.append(imageEl);
        const tempC = parseInt(item.temp.day) - 273.15;
        dayEl.append($("<p></p>").text(String.fromCharCode(160) + "Temp: " + tempC.toFixed(1)
            + " " + String.fromCharCode(176) + "C"));
        dayEl.append($("<p></p>").text(String.fromCharCode(160) + "Humidity: " + item.humidity + "%"));

    }

    /**
     * clears all cards having forecasted weather data.
     */
    function emptyForeCastCards() {
        for (var i = 1; i <= 5; i++) {
            $("#forecast-day" + i).children("div.card-body").empty();
        }
    }

    /**
     * hides the main pane which holds weather details for current and future
     */
    function hideWeatherDetailPane() {
        $("#weather-detail-pane").addClass("hide");
    }

    /**
     * shows the main pane which holds weather details for current and future
     */
    function showWeatherDetailPane() {
        $("#weather-detail-pane").removeClass("hide");
    }
});

