const util = require('../../utils/util.js')
const deviceUtil = require("../../utils/device")
Page({

  /**
   * 页面的初始数据
   * "10011000000000000001"
   */
  data: {
    fingerprintList: [], // ["1","0","1"]
    fingerprintNUm: 0,
    add: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
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
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let _this = this;
    wx.getStorage({
      key: 'deviceData',
      success (res) {
        console.log(JSON.parse(res.data))
        if(res.data){
          _this.setData({
            deviceData: JSON.parse(res.data || '[]')
          })
        }
      }
    })
    wx.getStorage({
      key: 'userList',
      success(res) {
        _this.setData({
          userList: JSON.parse(res.data) || [] 
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.setData({ add: false })
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
        // case 20:
        //   console.log('add',_this.data.add)
        //   if(_this.data.add){
        //     console.log('跳转')
        //     wx.navigateTo({
        //       url: '/pages/fingerprint/fingerprint',
        //     })
        //   }
        case 6:
          let obj = util.handleList(params.string);
          _this.setData({
            fingerprintList: obj.list,
            fingerprintNUm: obj.num
          });
          break;
        case 7:
          let str = '';
          let arr = params.string.split(",")
          if(arr[0] == '5' && _this.data.add){
            console.log('跳转')
            wx.navigateTo({
              url: '/pages/fingerprint/fingerprint',
            })
          }
          if(arr[0] == '4'){
            str = '删除失败，请稍后重试'
          }
          if(arr[0] == '6'){
            str = '添加失败，请稍后重试'
          }
          str && _this.toast(str)
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
        // console.log('writeBLECharacteristicValue success', new Date().getTime(), util.formatTime(new Date()), res)
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
  edit(event) {
    let _this = this;
    let data = event.currentTarget.dataset;
    let { userList } = this.data;
    console.log(event);
    wx.showModal({
      title: '名称修改',
      content: data.name,
      editable: true,
      success (res) {
        if (res.confirm && res.content) {
          for (let i = 0; i < userList.length; i++) {
            if(userList[i].id == data.id){
              userList[i].name = res.content
            }
          }
          console.log('userlist--->',userList)
          _this.setData({
            userList
          })
          wx.setStorage({
            key: "userlist",
            data: JSON.stringify(userList)
          })
          console.log('用户点击确定', res.content)
        }
      }
    })
  },
  del(e){
    let id = e.currentTarget.dataset.id
    let buffers = {
      "fun":"kws_download",
      "dpid": "7",
      "type":"2",
      "string": "0," + id,
    }
    this.writeBLECharacteristicValue(buffers)
  },

  add() {
    this.setData({ add: true })
    let buffers = {
      "fun":"kws_download",
      "dpid": "7",
      "type":"2",
      "string": "1",
    }
    // let buffers = {
    //   "fun":"kws_download",
    //   "dpid": "20",
    //   "type":"1",
    //   "value": "30",
    // }
    this.writeBLECharacteristicValue(buffers)
  },

  toast(msg){
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 2000
    })
  },
})