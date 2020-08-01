<template>
	<view>
		<uni-list>
			<uni-list-item titleFontSize="18px" :title="title" thumb="/static/images/my/mine_def_touxiang_3x.png" @tap="toLogin" />
		</uni-list>
		
		<uni-list style="margin-top: 20px;">
			<uni-list-item title="问题反馈"  :showArrow="true" @tap="toFeedBack"/>
			<uni-list-item title="关于"  :showArrow="true"/>
		</uni-list>
		
		<view style="margin: 20px 1px;">
			<button type="warn" @tap="logout">退出登录</button>
		</view>

	</view>
</template>

<script>
	export default {
		components: {},
		data() {
			return {
				title: "Hi, 您未登录"
			}
		},
		methods: {
			toFeedBack() {
				console.log("go to fd");
				uni.navigateTo({
					url: "/pages/component/feedback/feedback"
				})
			},
			toLogin() {
				console.log("to login interface");
			},
			logout() {
				uni.showModal({
					title: '提示',
					content: '确定退出登录？',
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
		}
	}
</script>

<style>



	/* #ifndef APP-NVUE */
	page {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		background-color: #efeff4;
		min-height: 100%;
		height: auto;
	}



</style>