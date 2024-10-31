import util from  "./util.js"

const getBLEDeviceCharacteristics = (deviceId, serviceId, callBack) => {
  wx.getBLEDeviceCharacteristics({
    deviceId,
    serviceId,
    success: (res) => {
      console.log('getBLEDeviceCharacteristics success', res.characteristics)
      for (let i = 0; i < res.characteristics.length; i++) {
        let item = res.characteristics[i]
        callBack(item);
      }
    },
    fail(res) {
      console.error('getBLEDeviceCharacteristics', res)
    }
  })
}
const onBLECharacteristicValueChange = (callBack) => {
  wx.onBLECharacteristicValueChange((characteristic) => {
    // console.log('监听T0',characteristic.value);
    // let hexString = util.ab2hex(characteristic.value);
    let hexString = util.ab2hex(characteristic.value.slice(1));
    if(!hexString) return;
    // 转换为字节数组
    let bytes = util.hexToBytes(hexString);
    // console.log('监听T1',util.ab2hex(characteristic.value), util.ab2hex(characteristic.value.slice(1)));
    // console.log('监听T2',util.hexToBytes(hexString));

    // 转换为文本字符串
    let string = util.bytesToString(bytes);
    console.log('监听T3:',string, isJSON(string));
    // 监听T3  {
    //   "fun":	"kws_update",
    //   "dpid":	"19",
    //   "type":	"1",
    //   "value":	"0"
    // }

    // 解析为对象
    let object = isJSON(string) && JSON.parse(string);
    callBack(object);
  })
  
}
const writeBLECharacteristicValue = (buffers, deviceId, serviceId, characteristicId) => {
  // let { deviceId, serviceId, characteristicId } = this.data;
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
  console.log(arrayBuffer);
  // console.log('时间2：',new Date().getTime(),util.formatTime(new Date()))
  wx.writeBLECharacteristicValue({
    deviceId,
    serviceId,
    characteristicId,
    value:arrayBuffer, 
    success (res) {
      // console.log('writeBLECharacteristicValue success', new Date().getTime())
    },
    fail(res) {
      console.error('writeBLECharacteristicValue', res)
    }
  })
}
const isJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  writeBLECharacteristicValue,
  onBLECharacteristicValueChange,
  getBLEDeviceCharacteristics
}
