// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   * {
      "connectable": true,
      "deviceId": "36E1A84C-5CE7-724A-BB51-8819DD61EC4E",
      "localName": "QUMI-AC-03480C",
      "name": "QUMI-AC-03480C",
      "advertisData": {},
      "RSSI": -50
    }
   */
  data: {
    isSearch: false,
    deviceList: [],
    deviceName: 'MS_'  //QUMI-AC  MS_
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // return;
    this.search();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

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
  search() {
    let _this = this;
    let { isSearch } = this.data;
    if(!isSearch){
      this.setData({
        isSearch: true
      })
    }else{
      this.stopBluetoothDevicesDiscovery();
    }
    this.setData({
      deviceList: []
    })
    console.log('开始搜索')
    // 初始化蓝牙模块
    wx.openBluetoothAdapter({
      success (res) {
        _this.startBluetoothDevicesDiscoveryzd();
      },
      fail: (res) => {
        console.log('openBluetoothAdapter fail---', res)
        if (res.errCode === 10001) {
          wx.showToast({
            title: "请打开蓝牙",
            icon: 'error',
          })
          // 监听蓝牙适配器状态
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              _this.startBluetoothDevicesDiscoveryzd();
              wx.offBluetoothAdapterStateChange();
            }
          })
        }
      }
    })
  },
  startBluetoothDevicesDiscoveryzd() {
    let _this = this;
    // 开始搜寻附近的蓝牙外围设备
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        setTimeout(function(){
          _this.stopBluetoothDevicesDiscovery()
        }, 1000)
        _this.onBluetoothDeviceFound()
      },
    })
  },
  onBluetoothDeviceFound() {
    let _this = this;
    let { deviceList, deviceName } = this.data;
    // console.log('deviceList', deviceList)
    // 监听搜索到新设备的事件
    wx.onBluetoothDeviceFound((res) => {
      // console.log('设备---》',JSON.stringify(res))
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        // console.log('设备---》',device.localName, device)
        // console.log('设备名---》',deviceName, device.localName, deviceList.length)
        if(device.localName){
          if(device.localName.indexOf(deviceName) >= 0){
            // console.log('22222', deviceList)
            if(deviceList.length){
              let flag = deviceList.every((item) => {
                // console.log('deviceId:',item.deviceId,'+', device.deviceId)
                return item.deviceId == device.deviceId
              })
              // console.log('3333', flag)
              if(!flag){
                deviceList.push(device)
              }
            }else{
              deviceList.push(device)
            }
          }
        }
      })
      _this.setData({
        deviceList
      })
      wx.setStorage({
        key:"deviceList",
        data: JSON.stringify(deviceList)
      })
    })
    // _this.stopBluetoothDevicesDiscovery() 
  },
  stopBluetoothDevicesDiscovery() {
    let _this = this;
    wx.stopBluetoothDevicesDiscovery({
      success (res) {
        _this.setData({isSearch: false})
        console.log('关闭蓝牙搜索成功')
      },
      fail: function(res) {
        console.error('关闭蓝牙搜索失败', res);
      }
    })
  },
 
  navigateTo(event) {
    let deviceData = event.currentTarget.dataset.item;
    console.log('deviceData', deviceData)
    wx.setStorage({
      key:"deviceData",
      data: JSON.stringify(deviceData)
    })
    wx.navigateBack()
  },
})