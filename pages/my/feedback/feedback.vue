<template>
    <view class="page">
        <view class='feedback-title'>
            <text>问题描述</text>
            <text class="feedback-quick" @tap="chooseMsg">快速键入</text>
        </view>
        <view class="feedback-body">
            <textarea placeholder="请详细描述你的问题..." v-model="advice" class="feedback-textare"></textarea>
        </view>
        <view class='feedback-title'>
            <text>图片(选填,提供问题截图)</text>
        </view>
        <view class="feedback-body feedback-uploader">
            <view class="uni-uploader">
                <view class="uni-uploader-head">
                    <view class="uni-uploader-title">点击预览图片</view>
                    <view class="uni-uploader-info">{{imageList.length}}/5</view>
                </view>
                <view class="uni-uploader-body">
                    <view class="uni-uploader__files">
                        <block v-for="(image,index) in imageList" :key="index">
                            <view class="uni-uploader__file" style="position: relative;">
                                <image class="uni-uploader__img" :src="image" @tap="previewImage(index)"></image>
                                <view class="close-view" @click="close(index)">x</view>
                            </view>
                        </block>
                        <view class="uni-uploader__input-box" v-show="imageList.length < 5">
                            <view class="uni-uploader__input" @tap="chooseImg"></view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <button type="default" class="feedback-submit" @tap="send">提交</button>

    </view>
</template>

<script>
    export default {
        data() {
            return {
                msgContents: ["界面显示错乱", "app卡顿，启动缓慢", "app偶尔崩溃"],
				advice: "",
                imageList: []
            }
        },
        onLoad() {
        },
        methods: {
            close(e) {
                this.imageList.splice(e, 1);
            },
            chooseMsg() { //快速输入
                uni.showActionSheet({
                    itemList: this.msgContents,
                    success: (res) => {
                        this.advice += this.msgContents[res.tapIndex];
                    }
                })
            },
            chooseImg() { //选择图片
                uni.chooseImage({
                    sourceType: ["camera", "album"],
                    sizeType: "compressed",
                    count: 5 - this.imageList.length,
                    success: (res) => {
                        this.imageList = this.imageList.concat(res.tempFilePaths);
                    }
                })
            },
            previewImage(index) { //预览图片
                uni.previewImage({
                    urls: this.imageList,
                    current: this.imageList[index]
                });
            },
            send() { //发送反馈
                
                if (this.advice.length === 0) {
                    uni.showModal({
                        content: '请输入你的问题',
                        showCancel: false
                    })
                    return
                }
                uni.showLoading({
                    title: '正在提交...'
                })
                let imgs = this.imageList.map((value, index) => {
                    return {
                        name: "images" + index,
                        uri: value
                    }
                })
                // TODO 服务端限制上传文件一次最大不超过 2M, 图片一次最多不超过5张
                uni.uploadFile({
                    url: "https://itime.cloud/problem/upload",
                    files: imgs,
                    formData: {
						"advice": this.advice,
						"phoneNumber": uni.getStorageSync("hasLogin")
					},
                    success: (res) => {
						console.log(res.data);
						uni.showToast({
							title: "提交成功",
							icon: "success",
							mask: true,
							duration: 2000,
							complete: () => {
								setTimeout(()=>{
									uni.navigateBack();
								}, 1000);
								
							}
						})
                    },
                    fail: (res) => {
                        console.log(JSON.stringify(res));
						uni.showModal({
							title: "提交失败",
							content: "网络异常，请稍后再试",
							showCancel: false
						});
                    },
                    complete() {
                        uni.hideLoading()
                    }
                });
            }
        }
    }
</script>

<style>
    page {
        background-color: #EFEFF4;
    }

    .input-view {
        font-size: 28rpx;
    }

    .close-view {
        text-align: center;
        line-height: 14px;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #FF5053;
        color: #FFFFFF;
        position: absolute;
        top: -6px;
        right: -4px;
        font-size: 12px;
    }
</style>
