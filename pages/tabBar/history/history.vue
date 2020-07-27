<template>
	<view >
		
		<uni-swipe-action style="margin-top: 30rpx;" v-for="(item, index) in listData" :key="index">
			<uni-swipe-action-item :options="options" :show="isOpened" :auto-close="false" @click="swipeClick($event,index)">
				<uni-list style="border-bottom-style: solid;border-bottom-width: 1px;">
					<uni-list-item :title="`保存时间: ${turnTs2Datetime(item.saveTimestamp)}`" rightText="" :showMore="true" :showArrow="false" @clickIcon="clickIcon('asd')" />
				</uni-list>
			</uni-swipe-action-item>
			
			<uni-list>
				<uni-list-item v-for="(cg, idx) in item.recordData" :key="idx" :title="`计次 ${cg.count}`" :rightText="`${formatTime(cg.gap)}`" :showArrow="false" />
			</uni-list>
				
		</uni-swipe-action>
		
		<view class="uni-padding-wrap uni-common-mt">
			<view class="uni-loadmore" v-if="showListLoadMore">{{listLoadMoreText}}</view>
		</view>
		

	</view>
</template>

<script>
	import uniIcons from '@/components/uni-icons/uni-icons.vue';
	import util from "@/common/util.js";
	export default {
		components: {
			uniIcons,
		},
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
				console.log(index);
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
						let strData = this.listData[index].recordData.map(item => `计次 ${item.count}\t\t${this.formatTime(item.gap)}`);
						strData = strData.reverse().join("\n")
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
