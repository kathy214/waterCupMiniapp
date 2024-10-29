const util = require('../../utils/util.js')
const deviceUtil = require("../../utils/device")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isConnecting: true,
    isConnected: false,
    isFailed: false,
    isOpenBlue: false,
    electric: 0,
    fingerprintNum: 2,
    deviceData: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // wx.openSetting();
    console.log('onload')
    this.openBluetoothAdapter()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('onshow')
    let _this = this;
    wx.getStorage({
      key: 'deviceData',
      success (res) {
        if(res.data){
          _this.setData({
            deviceData: JSON.parse(res.data || '{}')
          })
          _this.createBLEConnection();
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
    console.log('onUnload')
    wx.closeBluetoothAdapter();
  },
  // 初始化蓝牙
  openBluetoothAdapter(){
    let _this = this;
    wx.openBluetoothAdapter({
      success (res) {
        _this.setData({
          isOpenBlue: true
        })
        _this.createBLEConnection();
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
              _this.setData({
                isOpenBlue: true
              })
              _this.createBLEConnection();
              wx.offBluetoothAdapterStateChange();
            }
          })
        }
      }
    })
  },
   // 连接
   createBLEConnection() { 
    let _this = this;
    let { deviceId } = this.data.deviceData;
    console.log('deviceId---->',deviceId)
    let { isConnecting, isOpenBlue } = this.data;
    if(!isConnecting || !deviceId || !isOpenBlue){
      return;
    }
    wx.createBLEConnection({
      deviceId,
      success (res) {
        _this.getBLEDeviceServices(deviceId)
        _this.setData({
          isConnected: true,
          isConnecting: false,
          isFailed: false
        })
        wx.getSystemInfo({
          success: function (res) {
            console.log(res.system); // 输出操作系统类型
            if (res.system.indexOf('iOS') !== -1) {
              console.log("当前手机是iOS");
            } else if (res.system.indexOf('Android') !== -1) {
              wx.setBLEMTU({
                deviceId: deviceId,
                mtu: 512, // 设置需要的 MTU 大小，根据设备的支持情况进行设置
                success(res) {
                  console.log('设置 MTU 成功', res)
                },
                fail(res) {
                  console.log('设置 MTU 失败', res)
                }
              })
            } else {
              console.log("当前手机不是iOS也不是安卓");
            }
          }
        });
      },
      fail(res) {
        _this.setData({
          isConnecting: false,
          isFailed: true
        })
        if(res.errCode == 10003){
          _this.toast('连接失败， 请重试！')
        }else{
          _this.toast(res.errMsg)
        }
        console.log('createBLEConnection', res)
      }
    })
  },
  getBLEDeviceServices(deviceId) {
    let _this = this;
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log("当前监听数据：",res);
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary && res.services[i].uuid) {
            _this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
            return
          }
        }
      }
    })
  },
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    let _this = this;
    let { deviceData } = this.data;
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
        deviceData.serviceId = serviceId;
        deviceData.characteristicId = item.uuid;
        console.log('deviceData', deviceData)
        wx.setStorage({
          deviceData: JSON.stringify(deviceData)
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
          },
          fail (res) {
            console.log('notify启用失败', res)
          }
        })
        let buffers = {
          "fun":"kws_download",
          "dpid":"0",
          "type":"3",
          "string":"MS",
        }
        _this.writeBLECharacteristicValue(buffers)
      }
    })
    // 操作之前先监听，保证第一时间获取数据
    deviceUtil.onBLECharacteristicValueChange((params) => {
      switch(params.dpid*1) {
        case 1:
          this.setData({
            airFlag: (params.value == 1 ? true : false)
          });
          break;
        case 2:
          this.setData({
            mode: params.value
          });
          break;
        
      }
      this.setData({ loading: false })
    })
  },
  writeBLECharacteristicValue(buffers) {  
    console.log('dasta--->',this.data)
    let { deviceId, serviceId, characteristicId } = this.data.deviceData;
    let _this = this;
    const str = JSON.stringify(buffers);
    console.log('str--->',str);
    // str-- {"fun":"kws_download","dpid":"0","type":"2","string":"QUMI"}
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
    
    // console.log('arrayBuffer--->',util.ab2hex(arrayBuffer));
    // util.ab2hex(arrayBuffer) --  047b2266756e223a226b77735f646f776e6c6f6164222c2264706964223a2230222c2274797065223a2232222c22737472696e67223a2251554d49227d
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
        console.log('writeBLECharacteristicValue', res)
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
  navigateTo() {
    if(this.data.isConnected){
      wx.navigateTo({
        url: '/pages/control/control',
      })
    }else{
      this.createBLEConnection();
    }
  }
})