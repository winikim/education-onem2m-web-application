// 전역 변수
let firstDate = new Date();
let hours = firstDate.getHours();
let minutes = firstDate.getMinutes();
let seconds = firstDate.getSeconds();
let temperatureValue = 0;
let humidityValue = 0;
let dustValue = 0;
$(document).ready(function () {
    init();
    setInterval(function () { init(); }, 5000); // 5초마다 플랫폼에서 데이터 조회 하기
    $("#response").html("");
    $("#chartdiv").html("");

    /**
     * AmCharts 라이브러리를 활용한 차트 그리기
     */
    let chart = AmCharts.makeChart("chartdiv", {
        "type": "serial",
        "theme": "light",
        "zoomOutButton": {
            "backgroundColor": '#000000',
            "backgroundAlpha": 0.15
        },
        "dataProvider": generateChartData(),
        "categoryField": "time",
        "categoryAxis": {
            "parseDates": true,
            "minPeriod": "ss",
            "dashLength": 1,
            "gridAlpha": 0.15,
            "axisColor": "#DADADA"
        },
        "graphs": [{
            "id": "g1",
            "valueField": "temperature",
            //"bullet" : "round",
            "bulletBorderColor": "#FFFFFF",
            "bulletBorderThickness": 2,
            "lineThickness": 2,
            "lineColor": "#f45b5b",
            "negativeLineColor": "#0352b5",
            "hideBulletsCount": 50
        }, {
            "id": "g2",
            "valueField": "humidity",
            //"bullet" : "round",
            "bulletBorderColor": "#FFFFFF",
            "bulletBorderThickness": 2,
            "lineThickness": 2,
            "lineColor": "#4f8bc6",
            "negativeLineColor": "#0352b5",
            "hideBulletsCount": 50
        }, {
            "id": "g3",
            "valueField": "dust",
            //"bullet" : "round",
            "bulletBorderColor": "#FFFFFF",
            "bulletBorderThickness": 2,
            "lineThickness": 2,
            "lineColor": "#7FC470",
            "negativeLineColor": "#0352b5",
            "hideBulletsCount": 50
        }],
        "chartCursor": {
            "cursorPosition": "mouse"
        }
    })
    // 1초마다 차트를 갱신한다.
    setInterval(function () {
        let newDate = new Date();
        seconds++;
        if (seconds >= 60) {
            seconds = seconds - 60;
            minutes = minutes + 1;
            if (minutes >= 60) {
                minutes = 0;
                hours = hours + 1;
                if (hours >= 24) {
                    hours = 0;
                }
            }

        }
        newDate.setHours(hours, minutes, seconds);
        chart.dataProvider.push({
            time: newDate,
            temperature: temperatureValue,
            humidity: humidityValue,
            dust: dustValue
        });

        // remove datapoint from the beginning
        chart.dataProvider.shift();
        chart.validateData();
    }, 1000);


});

/**
   * 플랫폼에서 데이터 조회 후 HTML에 표시한다.
   */
function init() {
    //let url = '/initialize';
    let requestSensorSettings = {
        "url": "https://iot.winikim.me/Mobius/device/sensors/latest",
        "method": "GET",
        "headers": {
            "Accept": "application/json",
            "X-M2M-RI": "12345",
            "X-M2M-Origin": "/web-application"
        },
    };
    let requestLightResultSettings = {
        "url": "https://iot.winikim.me/Mobius/device/light/latest",
        "method": "GET",
        "headers": {
            "Accept": "application/json",
            "X-M2M-RI": "12345",
            "X-M2M-Origin": "/web-application"
        },
    };

    $.ajax(requestSensorSettings).done(function (response) {
        const contentInstance = response;
        const sensors = contentInstance["m2m:cin"].con
        temperatureValue = sensors.temperature;
        humidityValue = sensors.humidity;
        dustValue = sensors.dust;
        const dustDisplayName = calculateDust(dustValue);
        $('.temperature').empty();
        $('.temperature').append(temperatureValue);
        $('.humidity').empty();
        $('.humidity').append(humidityValue);
        $('.dust').empty();
        $('.dust').append(dustDisplayName);
    });

    $.ajax(requestLightResultSettings).done(function (response) {
        const contentInstance = response;
        const lightValue = contentInstance["m2m:cin"].con
        $('.light').empty();
        $('.light').append(calculateLight(lightValue));
    });
}

/**
 * 차트의 시간 이동을 위한 함수 
 */
function generateChartData() {
    let chartData = [];
    let nextSeconds = 0;
    for (nextSeconds = seconds; nextSeconds < seconds + 30; nextSeconds++) {
        let newDate = new Date(firstDate);
        newDate.setDate(firstDate.getDate());
        if (nextSeconds >= 60) {
            minutes = minutes + 1;
            if (minutes >= 60) {
                minutes = 0;
                hours = hours + 1;
            }
            if (hours >= 24) {
                hours = 0;
            }
            newDate.setHours(hours, minutes, nextSeconds - 60);
        }
        else {
            newDate.setHours(hours, minutes, nextSeconds);
        }
        chartData.push({
            "time": newDate,
            "temperature": temperatureValue,
            "humidity": humidityValue,
            "dust": dustValue
        });
    }
    seconds = nextSeconds;
    return chartData;

}



//light
function calculateLight(lightValue) {
    if (lightValue == '1') {
        return "ON";
    } else if (lightValue == '0') {
        return "OFF";
    } else {
        return "error";
    }
}
//dust
function calculateDust(dust_value) {
    let dustResult;
    if (dust_value < 31 || dust_value < 31.0) {
        dustResult = "Good";
    } else if ((dust_value < 81 && dust_value > 30) || (dust_value < 81.0 && dust_value > 30.0)) {
        dustResult = "Normal";
    } else if ((dust_value < 101 && dust_value > 80) || (dust_value < 101.0 && dust_value > 80.0)) {
        dustResult = "Bad";
    } else {
        dustResult = "Danger";
    }
    return dustResult;
}

function sendCommand(commandValue) {
    let contentInstanceOfLightCommand = {
        "m2m:cin": {
            "con": commandValue
        }
    }
    // m2m%3Acin%5Bcon%5D=ON
    var settings = {
        "url": "https://iot.winikim.me/Mobius/device/light-command",
        "method": "POST",
        "headers": {
          "Accept": "application/json",
          "X-M2M-RI": "123sdfgd45",
          "X-M2M-Origin": "/web-application",
          "Content-Type": "application/json; ty=4"
        },
        "data": JSON.stringify(contentInstanceOfLightCommand),
      };
      
      $.ajax(settings).done(function (response) {
        alert(commandValue + " 명령어 전송");
      });
}