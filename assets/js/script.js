$(document).ready(function () {
    var searchHistory = [];
    const apiKey = "c7fc00d9bea618f9caee6c402ba7deb6";
    //event listener for search text
    $(document).on("click", ".input-group-btn", function () {
        event.preventDefault();
        const city = $(".form-control").val().trim();
        if (city) {
            fetchAndRenderCityWeather(city);
            saveSearchHistory(city);
            renderSearchHistory();
        }
    });
    //event listener for click on search History list
    $(document).on("click", "#city-list", function (event) {
        const element = event.target;
        if (element.matches("li")) {
            const city = $(element).text();
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
    function initSearchHistory() {
        const savedHistory = localStorage.getItem("searchHistory");
        if (savedHistory) {
            searchHistory = JSON.parse(savedHistory);
        }
    }

    function renderSearchHistory() {
        $("#city-list").text("");
        $.each(searchHistory, function (index, item) {
            const listItem = $("<li></li>");
            $("#city-list").append(listItem);
            listItem.text(item);
        });
    }

    function saveSearchHistory(city) {
        const currentCityIndex = searchHistory.indexOf(city);
        if (currentCityIndex != -1) {
            searchHistory.splice(currentCityIndex, 1);
        }
        searchHistory.splice(0, 0, city);
        localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    }

    function fetchAndRenderCityWeather(city) {
        fetchCurrentCityWeather(city);
    }
    function fetchCurrentCityWeather(city) {
        const currentWeatherURL = "https://api.openweathermap.org/data/2.5/weather?q="
            + city + "&appid=" + apiKey;
        $.ajax({
            url: currentWeatherURL,
            method: "GET"
        })
            .then(renderCurrentWeather);

    }
    function renderCurrentWeather(response) {

        console.log(response);
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
        console.log(response.weather[0]);
        const iconURL = "https://openweathermap.org/img/wn/"
            + response.weather[0].icon + "@2x.png";
        imageEl.attr("src", iconURL);
        imageEl.attr("alt", response.weather[0].description);
        h3Element.append(imageEl);
        const tempC = parseInt(response.main.temp) - 273.15;
        $("#current-temp").text(" " + tempC.toFixed(2) + " ");
        $("#current-humidity").text(" " + response.main.humidity);
        $("#current-wind-speed").text(" " + response.wind.speed + " ");
        renderUVIndex(response);
        renderForecastWeather(response.coord.lat, response.coord.lon);
        showWeatherDetailPane();
    }

    function renderUVIndex(response) {
        const uvURL = "https://api.openweathermap.org/data/2.5/uvi?appid="
            + apiKey + "&lat=" + response.coord.lat + "&lon=" + response.coord.lon;
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
            })
    }
    function resetUVIndexColor(colorClass) {
        $("#current-uv-index").removeClass("favorable");
        $("#current-uv-index").removeClass("moderate");
        $("#current-uv-index").removeClass("severe");
        $("#current-uv-index").addClass(colorClass);

    }

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

                })

            });

    }

    function renderforecastDate(item, count) {
        const dayEl = $("#forecast-day" + count).children("div.card-body");
        const iconURL = "https://openweathermap.org/img/wn/"
            + item.weather[0].icon + "@2x.png";
        dayEl.append($("<h5></h5>").text(moment.unix(item.dt).format("DD/MM/YYYY")))
        const imageEl = $("<img>");
        imageEl.attr("src", iconURL);
        imageEl.attr("alt", "weather icon");
        imageEl.addClass("forcast-card-image");
        dayEl.append(imageEl);
        const tempC = parseInt(item.temp.day) - 273.15;
        dayEl.append($("<p></p>").text("Temp: " + tempC.toFixed(2)
            + " " + String.fromCharCode(176) + "C"));
        dayEl.append($("<p></p>").text("Humidity: " + item.humidity + "%"));

    }

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

