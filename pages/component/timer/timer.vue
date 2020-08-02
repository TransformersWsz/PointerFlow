<template>
	<view class="qiun-columns">

		<view class="qiun-bg-white qiun-title-bar qiun-common-mt">
			<view class="qiun-title-dot-light">秒表 {{time}}</view>
		</view>
		<view class="qiun-charts">
			<view>
				<canvas canvas-id="canvasGauge" id="canvasGauge" class="charts"></canvas>
			</view>
			
			<view class="under-charts">{{time}}</view>
			
			<view class="uni-flex uni-row" style="-webkit-justify-content: center;justify-content: center;">
				<button class="test" type="primary" @tap="leftBtnTapped">{{leftBtnText}}</button>
				<button class="test" type="warn" @tap="rightBtnTapped">{{rightBtnText}}</button>
			</view>
		</view>
		
		<view id="recordTitle">
			<uni-section style="font-size: 34rpx;" title="记录" type="line">
				<button class="operation" type="primary" @tap="copyToClipboard">复制</button>
				<button class="operation" type="primary" :disabled="isDisabled" @tap="save">保存</button>
			</uni-section>
		</view>
		<scroll-view :scroll-top="0" scroll-y="true" :style="{height: scrollHeight}">
			<uni-list>
				<uni-list-item v-for="(item, index) in recordData" :key="index" :title="`计次 ${item.count}`" :rightText="formatTime(item.gap)" :showArrow="false"/>
			</uni-list>
		</scroll-view>

	</view>
</template>

<script>
	import uCharts from '@/components/u-charts/u-charts.js';
	import util from "@/common/util.js";
	
	var _self;
	var canvasObj = {};

	export default {
		data() {
			return {
				isDisabled: true,
				scrollHeight: "300px",
				
				cWidth: '',
				cHeight: '',
				cWidth2: '', //横屏图表
				cHeight2: '', //横屏图表
				gaugeWidth: '', //仪表盘宽度,此设置可使各端宽度一致
				tips: '',
				pixelRatio: 1,
				serverData: '',
				itemCount: 30, //x轴单屏数据密度
				sliderMax: 50,
				
				leftBtnText: "启动",
				rightBtnText: "复位",
				
				recordData: [],    // 掐表数据
				isPaused: false,    // 是否出现过暂停
				lastStartTimeStamp: 0,   // 上一次开始计时时间戳
				cumulativeTimeStamp: 0,    // 累计时间戳，防止中途出现暂停，把暂停时间也算进去
				time: `00:00.00`, // 文本显示时间（累计时间）
				timeValue: 0,    // 文本时间戳
				
				lastCountDownTimeStamp: 0,    // 上一次计次时间戳，以便计算gap
				timer_text: null, // 文本计时器
				timer_clock: null, // 指针计时器
				ratio: 0,    // 指针已转比例

				localdata: {
					tips: "",
					Gauge: {
						categories: [
							{
								value: 0.1,
								color: "#2fc25b"
							},
							{
								value: 1,
								color: "#2fc25b"
							}
						],
						series: [{
							name: "完成率",
							data: 0
						}]
					}
				}
			}
		},
		onLoad() {
			console.log("It is load!");
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
			console.log("It is ready!");
			_self.fillData(_self.localdata);
			
			this.setScrollHeight();
		},
		
		onNavigationBarButtonTap(e) {
			if (this.recordData.length == 0) {
				uni.showToast({
					title: '您尚未记录任何数据',
					icon: 'none'
				});
			}
			else {
				const tempRecordData = this.recordData.map(item => {
					return {
						"count": item.count, 
						"gap": item.gap-item.gap%10
					};
				});
				console.log(tempRecordData);
				uni.setStorage({
					key: "tempRecordData",
					data: tempRecordData,
					success: () => {
						uni.navigateTo({
							url: `/pages/component/visual/visual`
						});
					}
				});
				
			}
		},
		
		methods: {
			setScrollHeight() {
				const info = uni.getSystemInfoSync();
				const windowHeight = info.windowHeight;
				uni.createSelectorQuery().select('#recordTitle').fields({
				   size: true,
				   rect: true
				}, (data) => {
					const scrollHeight = windowHeight - data.bottom - 2;
					this.scrollHeight = `${scrollHeight}px`;
					console.log("设置成功！", this.scrollHeight);
				}).exec();
			},
			getInfo() {
				uni.createSelectorQuery().select('#next').fields({
				   size: true,
				   rect: true
			   }, (data) => {
					console.log(data);
					console.log(typeof(data))
			   }).exec();
				const res = uni.getSystemInfoSync();
				console.log(res.screenWidth, res.screenHeight, res.windowWidth, res.windowHeight, res.navigationBarHeight, res.statusBarHeight, res.titleBarHeight);
			},
			
			formatTime(timestamp) {
				return util.ms2msm(timestamp).slice(0, 8);
			},
			
			copyToClipboard() {    // 复制到剪贴板
				if (this.recordData.length == 0) {
					uni.showToast({
						title: '您尚未记录任何数据',
						icon: 'none'
					});
				}
				else {
					let strData = this.recordData.map(item => `计次 ${item.count}\t\t${this.formatTime(item.gap)}`);
					strData = strData.reverse().join("\n");
					console.log(strData);
					uni.setClipboardData({
						data: strData,
						success: () => {
							uni.showToast({
								title: '已复制到剪贴板',
								icon: 'success',
								mask: true
							});
						}
					});
				}
			},
			
			save() {    // 将数据保存到手机
				if (this.recordData.length == 0) {
					uni.showToast({
						title: '您尚未记录任何数据',
						icon: 'none'
					});
				}
				else {
					try {
						const item = {
							saveTimestamp: Date.now(),
							recordData: this.recordData
						};
					    let historyData = uni.getStorageSync("history");
					    if (historyData) {
					        historyData.unshift(item);
					    }
						else {
							historyData = [item];
						}
						uni.setStorage({
							key: "history",
							data: historyData,
							success: () => {
								uni.showToast({
									title: '保存成功',
									icon: 'success',
									mask: true,
									duration: 2000,
									success: () => {
										console.log("save success");
										console.log(uni.getStorageSync("history"));
									}
								});
								setTimeout(()=>{    // 跳转到历史记录页面
									uni.switchTab({
										url: '/pages/tabBar/history/history'
									})
								}, 2000);
							}
						});
					} catch (e) {
						console.log(e)
					    console.log("get history failure");
					}
				}
			},
			
			leftBtnTapped() {
				if (this.leftBtnText == "启动") {
					this.startCal();    // 开始计时
					this.leftBtnText = "计次";
					this.rightBtnText = "停止";
				}
				else {    // 计次
					this.countDown();
				}
			},
			
			rightBtnTapped() {
				if (this.rightBtnText == "复位") {
					this.clearData();    // 清除数据;
				}
				else {    // 暂停计时
					this.pauseCal();
					
					this.leftBtnText = "启动";
					this.rightBtnText = "复位";
				}
			},
			
			test() {
				console.log(this.records[0]["data"].length);
				console.log(this.records[0]);
				console.log(this.testvuex);
				console.log(this.$store.state.testvuex);
			},
			
			fillData(data) {
				this.serverData = data;
				this.tips = data.tips;

				let Gauge = {
					categories: [],
					series: []
				};

				Gauge.categories = data.Gauge.categories;
				Gauge.series = data.Gauge.series;
				this.showGauge("canvasGauge", Gauge);
			},

			showGauge(canvasId, chartData) {
				canvasObj[canvasId] = new uCharts({
					$this: _self,
					canvasId: canvasId,
					type: 'gauge',
					fontSize: 11,
					extra: {
						gauge: {
							type: 'default',
							width: _self.gaugeWidth * _self.pixelRatio, //仪表盘背景的宽度
							startAngle: 1.5,
							endAngle: 0.5,
							startNumber: 0,
							endNumber: 60,
							labelFormat: function(t) {
								switch (t + '') {
									case '0':
										return '';
									case '5':
										return '5';
									case '10':
										return '10';
									case '15':
										return '15';
									case '20':
										return '20';
									case '25':
										return '25';
									case '30':
										return '30';
									case '35':
										return '35';
									case '40':
										return '40';
									case '45':
										return '45';
									case '50':
										return '50';
									case '55':
										return '55';
									case '60':
										return '60';
								}
							},
							splitLine: {
								fixRadius: 0,
								splitNumber: 12,
								width: _self.gaugeWidth * _self.pixelRatio, //仪表盘背景的宽度
								color: '#FFFFFF',
								childNumber: 5,
								childWidth: _self.gaugeWidth * 0.4 * _self.pixelRatio, //仪表盘背景的宽度
							},
							pointer: {
								width: _self.gaugeWidth * 0.8 * _self.pixelRatio, //指针宽度
								color: '#00aaff'
							}
						}
					},
					background: '#FFFFFF',
					pixelRatio: _self.pixelRatio,
					categories: chartData.categories,
					series: chartData.series,
					// title: {
					// 	name: this.time,
					// 	color: "#f04864",
					// 	fontSize: 18 * _self.pixelRatio,
					// 	offsetY: 50 * _self.pixelRatio, //新增参数，自定义调整Y轴文案距离
					// },
					animation: false,
					width: _self.cWidth * _self.pixelRatio,
					height: _self.cHeight * _self.pixelRatio,
					dataLabel: true,
				});
			},

			startCal() {
				this.lastStartTimeStamp = Date.now();

				this.timer_text = setInterval(() => {
					let currentTimeStamp = Date.now();
					let timeKeeping = currentTimeStamp - this.lastStartTimeStamp;
					if (this.isPaused) {
						timeKeeping += this.cumulativeTimeStamp;
					}
					
					this.timeValue = timeKeeping;
					this.time = this.formatTime(timeKeeping);
					
					// canvasObj['canvasGauge'].updateData({    // 秒指针转动(手机端指针旋转异常)
					// 	title: {
					// 		name: this.time,
					// 		color: "#f04864",
					// 		fontSize: 18 * _self.pixelRatio,
					// 		offsetY: 50 * _self.pixelRatio, //新增参数，自定义调整Y轴文案距离
					// 	}
					// });
			
				}, 10);
				
				this.timer_clock = setInterval(() => {
					let sms = this.timeValue%60000;
					this.ratio = sms/60000;
					canvasObj['canvasGauge'].updateData({    // 秒指针转动
						series: [{
							data: this.ratio
						}]
					});
				
				}, 100); 
			},
			
			pauseCal() {    // 暂停计时
				this.isDisabled = false;
				
				clearInterval(this.timer_text);
				clearInterval(this.timer_clock);
				
				this.timer_text = null;
				this.timer_clock = null;
				
				this.isPaused = true;
				this.cumulativeTimeStamp += Date.now() - this.lastStartTimeStamp;
				
				
				setTimeout(()=>{    // 防止手机端出现time显示异常情况
					this.timeValue = this.cumulativeTimeStamp;
					this.time = this.formatTime(this.cumulativeTimeStamp);
					
				}, 2);

			},


			// 掐表一次
			countDown() {
				let gap = this.timeValue - this.lastCountDownTimeStamp;
				this.lastCountDownTimeStamp = this.timeValue;
				
				console.log(gap);
				
				let count = this.recordData.length + 1;
				this.recordData.unshift({
					count: count,
					gap: gap
				});
			},

			// 秒表清0
			clearData() {
				this.lastCountDownTimeStamp = 0;
				this.lastStartTimeStamp = 0;
				this.cumulativeTimeStamp = 0;
				this.isPaused = false;
				this.ratio = 0;
				this.timeValue = 0;
				this.time = `00:00.00`;
				this.recordData = [];
				this.isDisabled = true;
				canvasObj['canvasGauge'].updateData({    // 秒指针归0
					series: [{
						data: this.ratio
					}]
				});
				this.millisecond = 0;
				this.roundmsec = 0;
				this.second = 0;
				this.minute = 0;
			}
		}
	}
</script>

<style>
	page {
		background: #F2F2F2;
		width: 750rpx;
		overflow-x: hidden;
	}
	
	.scroll-Y {
		height: 0rpx;
	}
	
	
	.test {
		margin-top: 8rpx;
		width: 220rpx;
		height: 75rpx;
		line-height: 75rpx;
		font-size: 30rpx;
	}
	
	.operation {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 20%;
		height: 80%;
		margin-right: 10rpx;
		font-size: 30rpx;
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
		font-size: 35rpx;
		color: #000000
	}

	/* 通用样式 */
	.qiun-charts {
		width: 750rpx;
		height: 600rpx;
		position: relative;
		background-color: rgba(255, 255, 255, 1);
	}
	
	.under-charts {
		text-align: center;
		overflow: hidden;
		position: absolute;
		left: 30rpx;
		bottom: 230rpx;
		width: 90%;
		font-size: 35rpx;
		color: #2fc25b;
		background-color: rgba(34, 123, 233, -1);
		z-index: 1;
	}

	.charts {
		width: 750rpx;
		height: 500rpx;
		background-color: rgba(255, 255, 255, 1);
	}

</style>
