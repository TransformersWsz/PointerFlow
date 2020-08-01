<template>
	<view style="padding: 10rpx 20rpx;">
		<uni-swipe-action style="margin-top: 30rpx;" v-for="(item, index) in listData" :key="index">
			<uni-swipe-action-item :options="options" :show="isOpened" :auto-close="false" @click="swipeClick($event,index)">
				<uni-list style="border-bottom: 1px solid #e5e5e5;">
					<uni-list-item :title="`保存时间: ${turnTs2Datetime(item.saveTimestamp)}`" :showMore="true" :showArrow="false" @clickIcon="clickIcon('asd')" />
				</uni-list>
			</uni-swipe-action-item>
			
			<uni-list>
				<uni-list-item title="最大值" :rightText="formatTime(compute(item.recordData)[0])" :showArrow="false"/>
				<uni-list-item title="最小值" :rightText="formatTime(compute(item.recordData)[1])" :showArrow="false"/>
				<uni-list-item title="平均值" :rightText="formatTime(compute(item.recordData)[2])" :showArrow="false"/>
				<uni-list-item title="中位数" :rightText="formatTime(compute(item.recordData)[3])" :showArrow="false"/>
			</uni-list>
			
			<uni-collapse style="margin-top: 1px;">
				<my-collapse-item title="总计次" :num="item.recordData.length">
					<uni-list style="background-color: #f1f1f1;">
						<uni-list-item v-for="(cg, idx) in item.recordData" :key="idx" :title="`计次 ${cg.count}`" :rightText="`${formatTime(cg.gap)}`" :showArrow="false" />
					</uni-list>
				</my-collapse-item>
			</uni-collapse>
		</uni-swipe-action>

		<view class="uni-padding-wrap uni-common-mt">
			<view class="uni-loadmore" v-if="showListLoadMore">{{listLoadMoreText}}</view>
		</view>
		

	</view>
</template>

<script>
	import util from "@/common/util.js";
	export default {
		data() {
			return {
				isOpened: false,
				options: [{
					text: '数据分析',
					style: {
						backgroundColor: '#007aff'
					}
				}, {
					text: '复制',
					style: {
						backgroundColor: 'rgb(254,156,1)'
					}
				}, {
					text: '删除',
					style: {
						backgroundColor: 'rgb(255,58,49)'
					}
				}],
				
				
				listData: [],    // 列表数据
				historyData: [],    // 缓存数据
				showListLoadMore: false,    // 显示加载更多字样
				listLoadMoreText: "加载中...",
				batchSize: 3
			}
		},

		onLoad() {
			this.initData();
		},
		onShow() {
			console.log("history show");
			this.initData();
		},
		onUnload() {
			console.log("page unload");
		},
		onReachBottom() {
			console.log("onReachBottom");
			if (this.listData.length >= this.historyData.length) {
				this.listLoadMoreText = "没有更多数据了!";
			}
			else {
				this.showListLoadMore = true;
				setTimeout(() => {
					this.setListData();
				}, 300);
			}
			
		},
		onPullDownRefresh() {
			console.log('onPullDownRefresh');
			this.initData();
		},
		methods: {
			compute(recordData) {
				let arr = recordData.map(item => item.gap);
				arr.sort((a, b) => a-b);
				console.log(arr);
				const maxGap = arr[arr.length-1];
				const minGap = arr[0];
				const avgGap = (arr.reduce((prev,current,index,arr) => { return prev+current }) / arr.length).toFixed(2);
				const midGap = arr[Math.floor(arr.length/2)];
				return [maxGap, minGap, avgGap, midGap];
			},
			
			formatTime(timestamp) {
				return util.ms2msm(timestamp).slice(0, 8);
			},
			
			turnTs2Datetime(timestamp) {    // turn timestamp to datetime
				const date = new Date(timestamp);
				const year = date.getFullYear();
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const hour = date.getHours();
				const minute = date.getMinutes();
				const second = date.getSeconds();
				
				return `${year}/${month}/${day}  ${hour}:${minute}`;
			},
			
			swipeClick(e, index) {
				let { content } = e;
				if (content.text === '删除') {
					uni.showModal({
						title: '提示',
						content: '是否删除',
						success: (res) => {
							if (res.confirm) {
								this.listData.splice(index, 1);
								this.historyData.splice(index, 1);
								uni.setStorage({
									key: "history",
									data: this.historyData,
									success: () => {
										uni.showToast({
											title: '删除成功',
											icon: 'success',
											mask: true,
											duration: 2000,
											success: () => {
												console.log("save success");
												console.log(uni.getStorageSync("history"));
											}
										});
									}
								});
							} else if (res.cancel) {
								console.log('用户点击取消');
							}
						}
					});
				}
				else {
					if (content.text === "复制") {
						const recordData = this.listData[index].recordData;
						let max_min_avg_mid = this.compute(recordData);
						max_min_avg_mid = max_min_avg_mid.map(item => this.formatTime(item));
						
						const statistic = `最大值：${max_min_avg_mid[0]}\t最小值：${max_min_avg_mid[1]}\t平均值：${max_min_avg_mid[2]}\t中位数：${max_min_avg_mid[3]}`;
						let strData = recordData.map(item => `计次 ${item.count}\t\t${this.formatTime(item.gap)}`);
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
						})
					}
					else {    // 数据分析
						uni.navigateTo({
							url: `/pages/history/visual/visual?index=${index}`
						})
					}
				}
			},
			
			clickIcon(e) {
				console.log(e);
			},
			triggerCollapse(e) {
				if (!this.list[e].pages) {
					this.goDetailPage(this.list[e].url);
					return;
				}
				for (var i = 0; i < this.list.length; ++i) {
					if (e === i) {
						this.list[i].open = !this.list[e].open;
					} else {
						this.list[i].open = false;
					}
				}
			},
			initData() {
				setTimeout(() => {
					try {
						this.listData = [];
					    this.historyData = uni.getStorageSync("history");
					    if (this.historyData) {
							const length = this.listData.length;
					        this.listData = this.listData.concat(this.historyData.slice(length, length+this.batchSize));
							if (this.listData.length >= this.historyData.length) {    // 数据量太少，初始的时候一下子全部加载出来了
								this.showListLoadMore = false;
							}
							else {
								this.showListLoadMore = true;
								this.listLoadMoreText = "加载更多";
							}
					    }
						else {
							this.listLoadMoreText = "尚无历史记录";
						}
					} catch (e) {
						console.log(e)
					    console.log("get history failure");
					} finally {
						uni.stopPullDownRefresh();
					}
				}, 300);
			},
			setListData() {
				const length = this.listData.length;
				this.listData = this.listData.concat(this.historyData.slice(length, length+this.batchSize));
			}
		}
	}
</script>

<style>
	.content {
		padding: 15px;
		font-size: 14px;
		line-height: 20px;
		background-color: #f9f9f9;
		color: #666;
	}
	
	.uni-icon-wrapper {
		margin-right: 18rpx;
	}
	
	.sp {

		display: flex;
		flex-direction: row;
		flex: 1;
		justify-content: space-between;
		align-items: center;
	}
	
	.cont {
		flex: 1;
		height: 45px;
		line-height: 45px;
		padding: 0 15px;
		position: relative;
		background-color: #fff;
		font-size: 15px;
		border-bottom-color: #3b7884;
		border-bottom-width: 1px;
		border-bottom-style: solid;
	}
	
	.uni-container {
		padding: 15px;
		background-color: #f8f8f8;
	}
	
	
	.text {
		margin: 16rpx 0;
		width:100%;
		background-color: #fff;
		height: 120rpx;
		line-height: 120rpx;
		text-align: center;
		color: #555;
		border-radius: 8rpx;
	}
</style>
