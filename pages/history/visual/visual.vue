<template>
	<view class="qiun-columns">
		<view class="qiun-bg-white qiun-title-bar qiun-common-mt">
			<view class="qiun-title-dot-light">掐表记录（可横向拖拽带滚动条）</view>
			<!-- 使用图表拖拽功能时，建议给canvas增加disable-scroll=true属性，在拖拽时禁止屏幕滚动 -->
		</view>
		<view class="qiun-charts">
			<canvas canvas-id="canvasLineA" id="canvasLineA" class="charts" disable-scroll=true @touchstart="touchLineA"
			 @touchmove="moveLineA" @touchend="touchEndLineA"></canvas>
			<!-- 使用图表拖拽功能时，建议给canvas增加disable-scroll=true属性，在拖拽时禁止屏幕滚动 -->
		</view>

		<view>
			<uni-section title="统计结果" type="line"></uni-section>
			<uni-list>
				<uni-list-item title="最大值" :rightText="maxGap" :showArrow="false" />
				<uni-list-item title="最小值" :rightText="minGap" :showArrow="false" />
				<uni-list-item title="平均值" :rightText="avgGap" :showArrow="false" />
				<uni-list-item title="中位数" :rightText="midGap" :showArrow="false" />
			</uni-list>
		</view>

	</view>

</template>

<script>
	import uCharts from '@/components/u-charts/u-charts.js';
	import util from "@/common/util.js";
	var canvasObj = {};
	var _self;
	export default {
		data() {
			return {
				maxGap: 0,
				minGap: 0,
				avgGap: 0,
				midGap: 0,

				cWidth: '',
				cHeight: '',
				cWidth2: '', //横屏图表
				cHeight2: '', //横屏图表
				cWidth3: '', //圆弧进度图
				cHeight3: '', //圆弧进度图
				arcbarWidth: '', //圆弧进度图，进度条宽度,此设置可使各端宽度一致
				gaugeWidth: '', //仪表盘宽度,此设置可使各端宽度一致
				tips: '',
				pixelRatio: 1,
				serverData: '',
				itemCount: 30, //x轴单屏数据密度
				sliderMax: 50,
				lineA: {
					"categories": [
						"2012",
						"2013",
						"2014",
						"2015",
						"2016",
						"2017"
					],
					"series": [{

						"data": [
							35,
							8,
							25,
							37,
							4,
							20
						]
					}]
				},
				lineB: {}
			}
		},
		onLoad(option) {

			let tempRecordData = uni.getStorageSync("tempRecordData");
			const categories = tempRecordData.map(item => `${item.count}`).reverse();
			const data = tempRecordData.map(item => (item.gap / 1000).toFixed(2)).reverse();
			this.compute(tempRecordData.map(item => parseFloat((item.gap / 1000).toFixed(2))));
			let maxMinSeries = this.constructMaxMinSeries(tempRecordData)
			console.log(maxMinSeries);
			this.lineB = {
				"categories": categories,
				"series": [{
					"name": "掐表记录",
					"data": data,
					"type": "line"
				}, maxMinSeries[0], maxMinSeries[1]]
			};

			_self = this;

			this.cWidth = uni.upx2px(750);
			this.cHeight = uni.upx2px(500);
			this.cWidth2 = uni.upx2px(700);
			this.cHeight2 = uni.upx2px(1100);
			this.cWidth3 = uni.upx2px(250);
			this.cHeight3 = uni.upx2px(250);
			this.arcbarWidth = uni.upx2px(24);
			this.gaugeWidth = uni.upx2px(30);

		},
		onReady() {
			this.showLineA("canvasLineA", this.lineB);
		},

		methods: {
			formatTime(timestamp) {
				return util.ms2msm(timestamp).slice(0, 8);
			},
			constructMaxMinSeries(tempRecordData) {
				const gaps = tempRecordData.map(item => item.gap/1000).reverse();
				let maxData = Array(gaps.length).fill(null);
				let minData = Array(gaps.length).fill(null);
				
				const maxVal = Math.max(...gaps)
				const maxIdx = gaps.indexOf(maxVal);
				maxData[maxIdx] = maxVal.toFixed(2);
				
				const minVal = Math.min(...gaps);
				const minIdx = gaps.indexOf(minVal);
				minData[minIdx] = minVal.toFixed(2);
				return [{
					"name": "最大值",
					"data": maxData,
					"type": "point",
					"color": "#f04864"
				}, {
					"name": "最小值",
					"data": minData,
					"type": "point",
				}];
			},
			
			compute(arr) {
				arr.sort((a, b) => a - b);
				this.maxGap = arr[arr.length - 1].toFixed(2);
				this.minGap = arr[0].toFixed(2);
				this.avgGap = (arr.reduce((prev, current, index, arr) => {
					return prev + current
				}) / arr.length).toFixed(2);
				this.midGap = arr[Math.floor(arr.length / 2)].toFixed(2);
			},

			showLineA(canvasId, chartData) {
				canvasObj[canvasId] = new uCharts({
					$this: _self,
					canvasId: canvasId,
					type: 'mix',
					fontSize: 11,
					padding: [15, 15, 0, 15],
					legend: {
						show: true,
						padding: 5,
						lineHeight: 11,
						margin: 6,
					},
					background: '#FFFFFF',
					pixelRatio: _self.pixelRatio,
					categories: chartData.categories,
					series: chartData.series,
					animation: false,
					enableScroll: true, //开启图表拖拽功能
					xAxis: {
						disableGrid: false,
						type: 'grid',
						gridType: 'dash',
						itemCount: 4,
						scrollShow: true,
						scrollAlign: 'left',
					},
					yAxis: {
						gridType: 'dash',
						format: (val) => {
							return val.toFixed(2) + 's'
						}
					},
					width: _self.cWidth * _self.pixelRatio,
					height: _self.cHeight * _self.pixelRatio,
					dataLabel: true,
					dataPointShape: true,
					extra: {
						column: {
							width: 20 * _self.pixelRatio
						},
						tooltip: {
							bgColor: '#000000',
							bgOpacity: 0.7,
							gridType: 'dash',
							dashLength: 8,
							gridColor: '#1890ff',
							fontColor: '#FFFFFF',
							horizentalLine: true,
							xAxisLabel: true,
							yAxisLabel: true,
							labelBgColor: '#DFE8FF',
							labelBgOpacity: 0.95,
							labelAlign: 'left',
							labelFontColor: '#666666'
						}
					},
				});

			},
			touchLineA(e) {
				canvasObj['canvasLineA'].scrollStart(e);
			},
			moveLineA(e) {
				canvasObj['canvasLineA'].scroll(e);
			},
			touchEndLineA(e) {
				canvasObj['canvasLineA'].scrollEnd(e);
				//下面是toolTip事件，如果滚动后不需要显示，可不填写
				canvasObj['canvasLineA'].showToolTip(e, {
					format: function(item, category) {
						return category + ' ' + item.name + ':' + item.data
					}
				});
			},
		}
	}
</script>

<style>
	page {
		background: #F2F2F2;
		width: 750rpx;
		overflow-x: hidden;
	}

	.qiun-padding {
		padding: 2%;
		width: 96%;
	}

	.qiun-wrap {
		display: flex;
		flex-wrap: wrap;
	}

	.qiun-rows {
		display: flex;
		flex-direction: row !important;
	}

	.qiun-columns {
		display: flex;
		flex-direction: column !important;
	}

	.qiun-common-mt {
		margin-top: 10rpx;
	}

	.qiun-bg-white {
		background: #FFFFFF;
	}

	.qiun-title-bar {
		width: 96%;
		padding: 10rpx 2%;
		flex-wrap: nowrap;
	}

	.qiun-title-dot-light {
		border-left: 10rpx solid #0ea391;
		padding-left: 10rpx;
		font-size: 32rpx;
		color: #000000
	}

	/* 通用样式 */
	.qiun-charts {
		width: 750rpx;
		height: 500rpx;
		background-color: #FFFFFF;
	}

	.charts {
		width: 750rpx;
		height: 500rpx;
		background-color: #FFFFFF;
	}

	/* 横屏样式 */
	.qiun-charts-rotate {
		width: 700rpx;
		height: 1100rpx;
		background-color: #FFFFFF;
		padding: 25rpx;
	}

	.charts-rotate {
		width: 700rpx;
		height: 1100rpx;
		background-color: #FFFFFF;
	}
</style>
