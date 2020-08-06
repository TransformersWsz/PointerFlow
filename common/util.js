function formatTime(time) {
	if (typeof time !== 'number' || time < 0) {
		return time
	}

	var hour = parseInt(time / 3600)
	time = time % 3600
	var minute = parseInt(time / 60)
	time = time % 60
	var second = time

	return ([hour, minute, second]).map(function (n) {
		n = n.toString()
		return n[1] ? n : '0' + n
	}).join(':')
}

function formatLocation(longitude, latitude) {
	if (typeof longitude === 'string' && typeof latitude === 'string') {
		longitude = parseFloat(longitude)
		latitude = parseFloat(latitude)
	}

	longitude = longitude.toFixed(2)
	latitude = latitude.toFixed(2)

	return {
		longitude: longitude.toString().split('.'),
		latitude: latitude.toString().split('.')
	}
}

function turn2str(num, type) { // 将单个时间转换为字符串
	let s = `${num}`;
	if (type == 2) {
		if (num < 10) {
			s = `00${num}`;
		} else {
			if (num < 100) {
				s = `0${num}`;
			}
		}
	} else {
		if (num < 10)
			s = `0${num}`;
	}
	
	return s;
}

function ms2msm(timestamp) { // 将时间戳转换为分钟、秒、毫秒: 00.00.00
	
	let minute = Math.floor(timestamp / 60000);
	let second = Math.floor((timestamp - minute * 60000) / 1000);
	let millisecond = timestamp - minute * 60 * 1000 - second * 1000;
	minute = turn2str(minute, 0);
	second = turn2str(second, 1);
	millisecond = turn2str(millisecond, 2);
	return `${minute}:${second}.${millisecond}`.slice(0, 8);
}

function compute(recordData) {
	let arr = recordData.map(item => item.gap);
	arr.sort((a, b) => a-b);
	const maxGap = arr[arr.length-1];
	const minGap = arr[0];
	const avgGap = parseFloat((arr.reduce((prev,current,index,arr) => { return prev+current }) / arr.length).toFixed(2));
	const midGap = arr[Math.floor(arr.length/2)];
	
	return [maxGap, minGap, avgGap, midGap];
}

function copyToClipboard(recordData) {
	let max_min_avg_mid = compute(recordData);
	max_min_avg_mid = max_min_avg_mid.map(item => ms2msm(item).slice(0, 8));
	
	const statistic = `最大值：${max_min_avg_mid[0]}\t最小值：${max_min_avg_mid[1]}\t平均值：${max_min_avg_mid[2]}\t中位数：${max_min_avg_mid[3]}`;
	let strData = recordData.map(item => `计次 ${item.count}\t\t${ms2msm(item.gap).slice(0, 8)}`);
	let copyData = []
	for (let i = 0; i < strData.length; i++) {
		copyData.push(`${strData[i]}\t\t${statistic}`);
	}
	copyData = copyData.reverse().join("\n");
	uni.setClipboardData({
		data: copyData,
		success: () => {
			uni.showToast({
				title: '已复制到剪贴板',
				icon: 'success',
				mask: true
			});
		}
	});
}

var dateUtils = {
	UNITS: {
		'年': 31557600000,
		'月': 2629800000,
		'天': 86400000,
		'小时': 3600000,
		'分钟': 60000,
		'秒': 1000
	},
	humanize: function (milliseconds) {
		var humanize = '';
		for (var key in this.UNITS) {
			if (milliseconds >= this.UNITS[key]) {
				humanize = Math.floor(milliseconds / this.UNITS[key]) + key + '前';
				break;
			}
		}
		return humanize || '刚刚';
	},
	format: function (dateStr) {
		var date = this.parse(dateStr)
		var diff = Date.now() - date.getTime();
		if (diff < this.UNITS['天']) {
			return this.humanize(diff);
		}
		var _format = function (number) {
			return (number < 10 ? ('0' + number) : number);
		};
		return date.getFullYear() + '/' + _format(date.getMonth() + 1) + '/' + _format(date.getDate()) + '-' +
			_format(date.getHours()) + ':' + _format(date.getMinutes());
	},
	parse: function (str) { //将"yyyy-mm-dd HH:MM:ss"格式的字符串，转化为一个Date对象
		var a = str.split(/[^0-9]/);
		return new Date(a[0], a[1] - 1, a[2], a[3], a[4], a[5]);
	}
};

module.exports = {
	formatTime: formatTime,
	compute: compute,
	copyToClipboard: copyToClipboard,
	formatLocation: formatLocation,
	ms2msm: ms2msm,
	dateUtils: dateUtils
}
