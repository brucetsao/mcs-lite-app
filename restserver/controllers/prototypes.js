module.exports = function ($db) {
  var prototypes = $db.prototypes;
  var devices = $db.devices;
  var users = $db.users;
  var datachannels = $db.datachannels;


  var retrievAllTemplates = function(req, res, next) {
    return prototypes.retriveUserPrototypes({
      isActive: true,
      isTemplate: true,
    })
    .then(function(data) {
      res.send(200, { data: data });
    });
  };

  var retrievePrototypeDetail = function(req, res, next) {
    var userId = req.user.userId;
    var isAdmin = req.user.isAdmin;
    var prototypeId = req.params.prototypeId;

    var prototypeData;
    return prototypes.retriveUserPrototypes({
      prototypeId: prototypeId,
      isActive: true,
    })
    .then(function(data) {
      if (data.length !== 1) {
        return res.send(400, 'Can\'t find this prototype.')
      }
      prototypeData = data[0];
      if (isAdmin) {
        return devices.retrievePrototypeDevices({
          prototypeId: prototypeId,
        });
      } else {
        return devices.retrievePrototypeDevices({
          prototypeId: prototypeId,
          createUserId: userId,
        });
      }
    })
    .then(function(data){
      prototypeData.devices = data;
      prototypeData.devicesLength = data.length;
      return datachannels.retrievDatachannel({
        prototypeId: prototypeId,
      });
    })
    .then(function(data) {
      data.forEach(function(key, value) {
        Object.keys(key.format).forEach(function(k,v) {
          if (key.format[k].value) {
            key.format[k] = key.format[k].value
          }
        });
      });
      prototypeData.datachannels = data;

      return users.retrieveOneUser({
        userId: prototypeData.createUserId,
        isActive: true,
      });
    })
    .then(function(data) {
      prototypeData.user = {
        userId: data[0].userId,
        userName: data[0].userName,
      };
      return res.send(200, { data: prototypeData });
    })
    .catch(function(err) {
      return res.send(400, err);
    });
  };

  var retrievePrototype = function(req, res, next) {
    var userId = req.user.userId;
    var prototypesData = [];
    return prototypes.retriveUserPrototypes({
      createUserId: userId,
      isActive: true,
    })
    .then(function(data) {
      return res.send(200, { data: data });
    })
    .catch(function(err) {
      return res.send(400, err)
    })
  };

  var addNewPrototype = function(req, res, next) {
    var userId = req.user.userId;
    var field = {
      createUserId: userId,
      prototypeName: req.body.prototypeName,
      prototypeDescription: req.body.prototypeDescription,
      prototypeImageURL: req.body.prototypeImageURL,
      version: req.body.version || '0.0.1',
      isTemplate: false,
    };

    return prototypes.addNewPrototype(field)
    .then(function(data) {
      return res.send(200, { data: data });
    })
    .catch(function(err) {
      return res.send(400, err);
    });
  };

  var editPrototype = function(req, res, next) {
    var userId = req.user.userId;
    return prototypes.editPrototype({
      createUserId: userId,
      prototypeId: req.params.prototypeId,
      isActive: true,
    }, {
      prototypeName: req.body.prototypeName,
      prototypeDescription: req.body.prototypeDescription,
      prototypeImageURL: req.body.prototypeImageURL,
      version: req.body.version,
    })
    .then(function() {
      return res.send(200, {message: 'success'});
    })
    .catch(function(err) {
      return res.send(400, err);
    });
  };

  var deletePrototype = function(req, res, next) {
    var userId = req.user.userId;
    return prototypes.editPrototype({
      createUserId: userId,
      prototypeId: req.params.prototypeId,
    }, {
      isActive: false,
    })
    .then(function() {
      return res.send(200, {message: 'success'});
    })
    .catch(function(err) {
      return res.send(400, err);
    });
  };

  var clonePrototype = function(req, res, next) {
    var prototypeData;
    var prototypeId = req.params.prototypeId;
    var userId = req.user.userId;
    var data = req.body;
    data.userId = req.user.userId;
    return prototypes.clonePrototype(prototypeId, data)
    .then(function(data) {
      prototypeData = data;
      return datachannels.cloneDatachannel(prototypeId, data.prototypeId, userId)
    })
    .then(function(data) {
      prototypeData.datachannels = data;
      return res.send(200, { data: prototypeData });
    })
    .catch(function(err) {
      return res.send(400, err);
    });
  };

  var exportJSON = function(req, res, next) {
    var prototypeId = req.params.prototypeId;
    var exportData;
    return prototypes.exportPrototype(prototypeId)
    .then(function(data) {
      exportData = data;
      return datachannels.retrievDatachannel({
        prototypeId: prototypeId,
      });
    })
    .then(function(data) {
      data.forEach(function(key, index) {
        delete key.updatedAt;
        delete key.createdAt;
        delete key._id;
        delete key.createUserId;
        delete key.prototypeId;
      });

      exportData.datachannels = data;

      // var displayConfigsData = [];
      // var datachannelData = [];
      // data.forEach(function(key, index) {

      //   var dataObj = {};
      //   dataObj.dataChnId = key.datachannelId;
      //   dataObj.name = key.datachannelName;
      //   dataObj.description = key.datachannelDescription;
      //   Object.keys(key.format).forEach(function(k,v) {

      //     if (key.format)
      //     if (key.format[k].value) {
      //       key.format[k] = key.format[k].value
      //     }
      //   });
      //   console.log(key.format);
      //   dataObj.format = key.format;
      //   if (key.type === 1) {
      //     dataObj.isControllable = true;
      //   }
      //   dataObj.isHidden = key.isHidden;
      //   dataObj.channelType = key.channelType;
      //   datachannelData.push(dataObj);

      //   var displayObj = {};
      //   displayObj.showHistory = false;
      //   displayObj.displayOrder = index;

      //   displayConfigsData.push(displayObj);
      // });
      // exportData.displayConfigs = displayConfigsData;
      // exportData.datachannels = datachannelData;
      // console.log(JSON.stringify({prototype: exportData}))
    })
    .then(function() {
      exportData.source = 'mcs-lite';
      return res.send(200, { data: exportData });
    })
    .catch(function(err) {
      return res.send(400, err);
    })
  };

  var importJSON = function(req, res, next) {
    var content = {
    "prototypeName": "clonePrototype",
    "version": "3333",
    "prototypeDescription": "",
    "prototypeImageURL": "",
    "isActive": true,
    "isPublic": false,
    "datachannels": [
      {
        "datachannelId": "pwm_display",
        "datachannelName": "pwm_display",
        "datachannelDescription": "",
        "type": 2,
        "channelType": {
          "id": 12,
          "name": "PWM"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "hex",
        "datachannelName": "hex",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 4,
          "name": "Hex"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "hex_display",
        "datachannelName": "hex_display",
        "datachannelDescription": "",
        "type": 2,
        "channelType": {
          "id": 4,
          "name": "Hex"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "pwm",
        "datachannelName": "pwm",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 12,
          "name": "PWM"
        },
        "isHidden": true,
        "format": {
          "lowerbound": {
            "value": "0"
          },
          "upperbound": {
            "value": "100"
          }
        },
        "isActive": true
      },
      {
        "datachannelId": "string",
        "datachannelName": "string",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 5,
          "name": "String"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "integer_display",
        "datachannelName": "integer_display",
        "datachannelDescription": "",
        "type": 2,
        "channelType": {
          "id": 1,
          "name": "Integer"
        },
        "isHidden": true,
        "format": {
          "unit": "aaa",
          "lowerbound": {
            "value": "2"
          },
          "upperbound": {
            "value": "200"
          }
        },
        "isActive": true
      },
      {
        "datachannelId": "switch",
        "datachannelName": "switch",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 7,
          "name": "Switch"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "float3",
        "datachannelName": "float3",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 2,
          "name": "Float"
        },
        "isHidden": true,
        "format": {
          "unit": {},
          "lowerbound": {
            "value": "2"
          },
          "upperbound": {
            "value": "200"
          }
        },
        "isActive": true
      },
      {
        "datachannelId": "gpio",
        "datachannelName": "gpio",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 11,
          "name": "GPIO"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "switch_display",
        "datachannelName": "switch_display",
        "datachannelDescription": "",
        "type": 2,
        "channelType": {
          "id": 3,
          "name": "Switch"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "integer",
        "datachannelName": "integer",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 1,
          "name": "Integer"
        },
        "isHidden": true,
        "format": {
          "unit": {},
          "lowerbound": {
            "value": "2"
          },
          "upperbound": {
            "value": "200"
          }
        },
        "isActive": true
      },
      {
        "datachannelId": "string_display",
        "datachannelName": "string_display",
        "datachannelDescription": "",
        "type": 2,
        "channelType": {
          "id": 5,
          "name": "String"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "float",
        "datachannelName": "float",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 2,
          "name": "Float"
        },
        "isHidden": true,
        "format": {
          "unit": {},
          "lowerbound": {
            "value": "2"
          },
          "upperbound": {
            "value": "200"
          }
        },
        "isActive": true
      },
      {
        "datachannelId": "gpio_display",
        "datachannelName": "gpio_display",
        "datachannelDescription": "",
        "type": 2,
        "channelType": {
          "id": 11,
          "name": "GPIO"
        },
        "isHidden": true,
        "format": {},
        "isActive": true
      },
      {
        "datachannelId": "float1",
        "datachannelName": "float1",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 2,
          "name": "Float"
        },
        "isHidden": true,
        "format": {
          "unit": {},
          "lowerbound": {
            "value": "2"
          },
          "upperbound": {
            "value": "200"
          }
        },
        "isActive": true
      },
      {
        "datachannelId": "float2",
        "datachannelName": "float2",
        "datachannelDescription": "",
        "type": 1,
        "channelType": {
          "id": 2,
          "name": "Float"
        },
        "isHidden": true,
        "format": {
          "unit": {},
          "lowerbound": {
            "value": "2"
          },
          "upperbound": {
            "value": "200"
          }
        },
        "isActive": true
      }
    ],
    "source": "mcs-lite"
  };
    var userId = req.user.userId;
    var isMCSLite;

    if (content.source === 'mcs-lite') {
      isMCSLite = true;
    } else {
      isMCSLite = false;
    }

    return prototypes.importPrototype(content, userId, isMCSLite)
    .then(function(data) {
      return datachannels.importDataChannel(datachannelData, userId, data.prototypeId, isMCSLite);
    })
    .then(function(data) {
      console.log(1111)
      return res.send(200, { message: 'success.' });
    })
    .catch(function(err) {
      return res.send(400, err);
    });
  };

  return {
    retrievePrototypeDetail: retrievePrototypeDetail,
    retrievePrototype: retrievePrototype,
    addNewPrototype: addNewPrototype,
    editPrototype: editPrototype,
    deletePrototype: deletePrototype,
    clonePrototype: clonePrototype,
    retrievAllTemplates: retrievAllTemplates,
    importJSON: importJSON,
    exportJSON: exportJSON,
  };

};