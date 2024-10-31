const util = require('../../utils/util.js')
const deviceUtil = require("../../utils/device")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    deviceData:{},
    step: 0,
    finished: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // wx.showModal({
    //   title:'温馨提示',
    //   content: '指纹录入中，退出后录入无效！',
    //   cancelText:'继续录入',
    //   cancelColor:'#000000',
    //   confirmText: '确认退出',
    //   confirmColor: '#FA2F2F',
    //   success (res) {
    //     if (res.confirm) {
    //       console.log('用户点击确定')
    //     }else if (res.cancel) {
    //       console.log('用户点击取消')
    //     }
    //   }
    // })
    this.goBack();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let _this = this;
    wx.getStorage({
      key: 'deviceData',
      success (res) {
        if(res.data){
          _this.setData({
            deviceData: JSON.parse(res.data || '[]')
          })
          _this.getBLEDeviceCharacteristics()
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  getBLEDeviceCharacteristics() {
    let _this = this;
    let { deviceId, serviceId } = this.data.deviceData;
    deviceUtil.getBLEDeviceCharacteristics(deviceId, serviceId, (item) => {
      if (item.properties.read) {
        wx.readBLECharacteristicValue({
          deviceId,
          serviceId,
          characteristicId: item.uuid,
          success(res) {
            console.log(`读取的特征值为: ${res.value}`);
          },
          fail(res) {
            console.error("读取失败",res);
          }
        })
      }
      if (item.properties.write) {
        _this.setData({
          serviceId,
          canWrite: true,
          characteristicId: item.uuid
        })
      }
      if (item.properties.notify || item.properties.indicate) {
        wx.notifyBLECharacteristicValueChange({
          deviceId,
          serviceId,
          characteristicId: item.uuid,
          state: true,
          success (res) {
            console.log('notify启用成功')
            // console.log('notify启用成功', serviceId,item.uuid)
          },
          fail (res) {
            console.log('notify启用失败', res)
          }
        })
        let buffers = {
          "fun":"kws_download",
          "dpid":"0",
          "type":"1",
          "value":"MS",
        }
        _this.writeBLECharacteristicValue(buffers)
      }
    })
   
    // 操作之前先监听，保证第一时间获取数据
    deviceUtil.onBLECharacteristicValueChange((params) => {
      switch(params.dpid*1) {
        case 8:
          console.log('步骤：', params.value)
          this.setData({
            step: params.value
          });
          break;
        case 9:
          let arr = params.string.split(",")
          let msg = ''
          if(arr[0] == 0 && _this.data.step >= 8){
            wx.navigateTo({
              url: '/pages/list/list',
            })
          }
          if(arr[0] == 1){
            mag = '按压重复面积过多，请挪动手指再次按压'
          }
          if(arr[0] == 2){
            mag = '录入超时，退出当前模式'
          }
          if(arr[0] == 3){
            mag = '失败，退出当前模式'
          }
          if(arr[0] == 4){
            mag = '其他异常'
          }
          msg && this.toast(msg)
          break;
      }
    })
    return;
  },
  writeBLECharacteristicValue(buffers) {  
    let { deviceId, serviceId, characteristicId } = this.data.deviceData;
    let _this = this;
    const str = JSON.stringify(buffers);
    console.log(str);
    // 创建一个 ArrayBuffer 和 DataView
    let data = new ArrayBuffer(str.length+1);
    let buffer = new DataView(data);
    // 将字符串转换为 Uint8Array
    for (let i = 1; i < str.length+1; i++) {
      buffer.setUint8(i, str.charCodeAt(i-1));
    }
    buffer.setUint8(0, 4)
    // 将 DataView 转换为 ArrayBuffer
    let arrayBuffer = buffer.buffer;
    
    // console.log(ab2hex(arrayBuffer));
    // console.log(arrayBuffer);
    // console.log('时间2：',new Date().getTime(),util.formatTime(new Date()))
    wx.writeBLECharacteristicValue({
      deviceId,
      serviceId,
      characteristicId,
      // writeType:'writeNoResponse',
      value:arrayBuffer, 
      success (res) {
        console.log('writeBLECharacteristicValue success', new Date().getTime(), util.formatTime(new Date()), res)
      },
      fail(res) {
        if(res.errCode == 10001){
          _this.toast('蓝牙已断开')
        }else if(res.errCode == 10006){
          _this.toast('设备连接已断开')
        }else{
          _this.toast(res.errMsg)
        }
        console.error('writeBLECharacteristicValue', res)
      }
    })
  },
  goBack(){
    wx.enableAlertBeforeUnload({
      message: '指纹录入中，退出后录入无效！',
      success(res){
        console.log('success')
      },
      fail(res){
        console.log('fail')
      }
    })
  },
  toast(msg){
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 2000
    })
  },
  next(){
    let { step } = this.data;
    if(step < 8){
      step++;
      this.setData({step})
    }else{
      wx.showModal({
        title: '指纹名称',
        editable: true,
        placeholderText: '请输入指纹名称',
        success (res) {
          if (res.confirm && res.content) {
            // for (let i = 0; i < userList.length; i++) {
            //   if(userList[i].id == data.id){
            //     userList[i].name = res.content
            //   }
            // }
            // console.log('userlist--->',userList)
            // _this.setData({
            //   userList
            // })
            // wx.setStorage({
            //   key: "userlist",
            //   data: JSON.stringify(userList)
            // })
            console.log('用户点击确定', res.content)
          }
        }
      })
    }
  }
  
})