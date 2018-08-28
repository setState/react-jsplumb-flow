import React, { Component } from 'react'
import 'jsplumb'

import './data/data1'
import './index.css'

const jsPlumb = window.jsPlumb
const containerId = 'diagramContainer'
const containerSelector = '#' + containerId
const visoSelector = '#operate .viso-item'

// 很多连接线都是相同设置的情况下，可以将配置抽离出来，作为一个单独的变量，作为connect的第二个参数传入。
// 实际上connect的第二个参数会和第一个参数merge，作为一个整体。
const commonConfig = {
  // 是否可以拖动（作为连线起点）
  isSource: true,
  // 是否可以放置（连线终点）
  isTarget: true,
  // 设置连接点最多可以连接几条线
  // -1不限制，默认限制一条线
  maxConnections: -1,
  // 设置锚点位置，按照[target, source]的顺序进行设置
  // 可以有 Bottom Top Right Left四种方位
  // 还可以是BottomLeft BottomRight BottomCenter TopLeft TopRight TopCenter LeftMiddle RightMiddle的组合
  // 默认值 ['Bottom', 'Bottom']
  // anchor: ['Bottom', 'Bottom'],
  // 端点类型，形状（区分大小写），Rectangle-正方形 Dot-圆形 Blank-空
  endpoint: ['Dot', {
    radius: 4,
  }],
  // 设置端点的样式
  endpointStyle: {
    fill: '#456', // 填充颜色
    outlineStroke: 'blank', // 边框颜色
    outlineWidth: 0, // 边框宽度
  },
  // 设置连接线的样式 Bezier-贝瑟尔曲线 Flowchart-流程图 StateMachine-弧线 Straight-直线
  connector: ['Flowchart'],
  // 设置连接线的样式
  connectorStyle: {
    stroke: '#456', // 实线颜色
    strokeWidth: 3, // 实线宽度
    outlineStroke: 'blank', // 边框颜色
    outlineWidth: 2, // 边框宽度
  },
  // 设置连接线悬浮样式
  connectorHoverStyle: {
    stroke: 'lightblue', // 实线颜色
  },
  // 设置连接线的箭头
  // 可以设置箭头的长宽以及箭头的位置，location 0.5表示箭头位于中间，location 1表示箭头设置在连接线末端。 一根连接线是可以添加多个箭头的。
  connectorOverlays: [
    ['Arrow', {
        width: 10,
        length: 10,
        location: 1
    }],
    ['Label', {
      label: '',
      cssClass: 'jtk-overlay-label',
      location: 0.4,
      events: {
        click: function (labelOverlay, originalEvent) {
          console.log('点击连接线的文字内容', labelOverlay, originalEvent)
        }
      }
    }]
  ]
}

export default class JSPlumbFlow extends Component {
  // 初始化页面常量、绑定事件方法
  constructor(props) {
    super(props)

    // 组件数据
    this.state = {}
  }

  // DOM挂载完成时调用
  componentDidMount() {
    this.initFlow()
  }

  // 初始化流程图
  initFlow() {
    jsPlumb.ready(() => {
      // 设置绘图容器
      jsPlumb.setContainer(containerId)

      // 可以使用importDefaults，来重写某些默认设置
      jsPlumb.importDefaults({
        ConnectionsDetachable: false, // 一般来说拖动创建的连接，可以再次拖动，让连接断开。如果不想触发这种行为，可以设置。
      })

      // 绑定加载数据的操作数据
      this.bindLoadData()

      // 绑定删除连接线的操作处理
      this.bindDeleteConnection()

      // 绑定保存数据的操作数据
      this.bindSaveData()

      // 绑定清除数据的操作数据
      this.bindClearData()

      // 绑定删除节点操作
      this.bindRemoveNode()

      // 绑定节点内容编辑
      this.bindEditNodeName()

      // 加载数据并绘制流程图
      this.loadDataAndPaint()

      // 绑定连接线添加label文本
      this.bindConnectionAddLabel()

      // // 设置拖拉
      // $(visoSelector).draggable({
      //   helper: 'clone',
      //   scope: 'ss',
      // })

      // // 放置拖拉
      // $(containerSelector).droppable({
      //   scope: 'ss',
      //   drop: (event, ui) => {
      //     const x = parseInt(ui.offset.left - $(containerSelector).offset().left)
      //     const y = parseInt(ui.offset.top - $(containerSelector).offset().top)
      //     const type = ui.helper.attr('data-type')
      //     const id = `${type}${new Date().valueOf()}`
      //     const name = ui.helper.html()

      //     // 添加节点
      //     this.appendNode({ id, type, x, y, name })
      //   }
      // })
    })
  }

  // 添加节点
  appendNode(info) {
    let styleText = `position: absolute; left: ${info.x}px; top: ${info.y}px;`
    if (info.width) {
      styleText += `width: ${info.width}px; height: ${info.height}px;`
    }

    const eleAppend = document.createElement('div')
    eleAppend.setAttribute('id', info.id)
    eleAppend.className = `viso-item viso-${info.type}`
    eleAppend.style.cssText = styleText
    eleAppend.innerHTML = `
      <span class="viso-name">${info.name}</span>
      <span class="viso-close">&times;</span>
    `

    document.querySelector(containerSelector).appendChild(eleAppend)
    document.querySelector(`#${info.id}`).setAttribute('data-type', info.type)

    // 设置默认表现
    this.setDefault(info.id)
  }

  // 设置默认表现
  setDefault(id) {
    this.setDraggable(id)
    this.addEndpoint(id)
  }

  // 设置指定节点可拖动
  setDraggable(id) {
    jsPlumb.draggable(id, {
      containment: 'parent', // 限制节点的拖动区域
      grid: [10, 10], // 设置网格
    })
  }

  // 给指定节点添加端点
  addEndpoint(id) {
    jsPlumb.addEndpoint(id, {anchors: 'Left', uuid: `${id}-anchor-left-middle`}, commonConfig)
    jsPlumb.addEndpoint(id, {anchors: 'Right', uuid: `${id}-anchor-right-middle`}, commonConfig)
    jsPlumb.addEndpoint(id, {anchors: 'Top', uuid: `${id}-anchor-center-top`}, commonConfig)
    jsPlumb.addEndpoint(id, {anchors: 'Bottom', uuid: `${id}-anchor-center-bottom`}, commonConfig)
  }

  // 设置连线
  setConnection(info) {
    jsPlumb.connect({
      uuids: [this.getAnchorID(info.source), this.getAnchorID(info.target)],
      overlays: [
        [ "Label", {label: "text", cssClass: 'jtk-overlay-label', location: 0.4,}]
      ]
    })
  }

  // 获取端点id
  getAnchorID(anchorInfo) {
    const nodeInfo = this.getNodeInfo(document.getElementById(anchorInfo.elementId))
    const posX = (anchorInfo.x - nodeInfo.x) / nodeInfo.width
    const posY = (anchorInfo.y - nodeInfo.y) / nodeInfo.height
    let posXName = 'center'
    let posYName = 'middle'

    if (posX === 0) {
      posXName = 'left'
    } else if (posX > 0.6) {
      posXName = 'right'
    }

    if (posY === 0) {
      posYName = 'top'
    } else if (posY > 0.6) {
      posYName = 'bottom'
    }

    return `${anchorInfo.elementId}-anchor-${posXName}-${posYName}`
  }

  // 清除画布内容
  clearCont() {
    // 删除所有连接线
    jsPlumb.deleteEveryConnection()

    // 删除所有端点
    jsPlumb.deleteEveryEndpoint()

    // 删除所有节点
    document.querySelector(containerSelector).innerHTML = ''
  }

  // 获取节点数据
  getNodeData() {
    const visoEles = document.querySelectorAll(containerSelector + ' .viso-item')
    const nodeData = []

    for (let i = 0, len = visoEles.length; i < len; i++) {
      const nodeInfo = this.getNodeInfo(visoEles[i])

      if (!nodeInfo.id) {
        throw new Error('流程图节点必须包含id')
      }

      if (!nodeInfo.name) {
        throw new Error('流程图节点必须包含name')
      }

      nodeData.push({
        id: nodeInfo.id,
        name: nodeInfo.name,
        type: nodeInfo.type,
        width: nodeInfo.width,
        height: nodeInfo.height,
        x: nodeInfo.x,
        y: nodeInfo.y,
      })
    }

    return nodeData
  }

  // 获取节点相关信息
  getNodeInfo(ele) {
    const id = ele.getAttribute('id')
    const eleName = ele.querySelector('.viso-name')
    const name = (eleName.innerText || eleName.textContent).replace(/^\s+|\s+$/g, '')
    const currentStyle = ele.currentStyle || window.getComputedStyle(ele, null)

    return  {
      id: id,
      name: name,
      type: ele.getAttribute('data-type'),
      width: parseInt(currentStyle.width, 10) || 80,
      height: parseInt(currentStyle.height, 10) || 80,
      x: parseInt(currentStyle.left, 10) || 0,
      y: parseInt(currentStyle.top, 10) || 0,
    }
  }

  // 获取连线数据
  getConnectionData() {
    const originalData = jsPlumb.getAllConnections()
    const connectionData = []

    originalData.forEach((item) => {
      const anchorSource = item.endpoints[0].anchor
      const anchorTarget = item.endpoints[1].anchor
      const anchorSourceInfo = {
        name: anchorSource.type,
        x: anchorSource.x,
        y: anchorSource.y,
      }
      const anchorTargetInfo = {
        name: anchorTarget.type,
        x: anchorTarget.x,
        y: anchorTarget.y,
      }
      const anchorSourcePosition = this.getAnchorPosition(anchorSource.elementId, anchorSourceInfo)
      const anchorTargetPosition = this.getAnchorPosition(anchorTarget.elementId, anchorTargetInfo)

      connectionData.push({
        // 连线id
        id: item.id,
        // 源节点
        source: {
          elementId: anchorSource.elementId,
          x: anchorSourcePosition.x,
          y: anchorSourcePosition.y,
        },
        // 目标节点
        target: {
          elementId: anchorTarget.elementId,
          x: anchorTargetPosition.x,
          y: anchorTargetPosition.y,
        },
      })
    })

    return connectionData
  }

  // 获取节点坐标信息
  getAnchorPosition(elementId, anchorInfo) {
    const nodeInfo = this.getNodeInfo(document.getElementById(elementId))

    return {
      x: nodeInfo.x + nodeInfo.width*anchorInfo.x,
      y: nodeInfo.y + nodeInfo.height*anchorInfo.y,
    }
  }

  // 加载数据并绘制流程图
  loadDataAndPaint() {
    const defData = {connectionData: [], nodeData: []}
    const storageData = localStorage.getItem('visoData')
    const visoData = storageData ? JSON.parse(storageData) : defData
    const nodeData = visoData.nodeData
    const connectionData = visoData.connectionData

    // 清除内容
    this.clearCont()

    // 添加节点
    nodeData.forEach((item) => {
      this.appendNode(item)
    })

    // 创建连线
    connectionData.forEach((item) => {
      this.setConnection(item)
    })
  }

  // 绑定删除连接线的操作处理
  bindDeleteConnection() {
    jsPlumb.bind('dblclick', function (connection, originalEvent) {
      if (window.confirm('确定删除所点击的连接线吗？')) {
        // 删除指定连接线
        jsPlumb.deleteConnection(connection)
      }
    })
  }

  // 绑定连接线添加label文本
  bindConnectionAddLabel() {
    // 建立连接线之前触发
    // 返回true正常建立连线，返回false取消连接
    // jsPlumb.bind('beforeDrop', function (info, originalEvent) {
    //   console.log('beforeDrop-', info)
    //   console.log(info.connection.getLabel)

    //   const output = window.prompt('请输入连接线的label')

    //   getOverlay

    //   return false;
    // })

    // 建立端点之间的连接线时触发
    // jsPlumb.bind('connection', function (info, originalEvent) {
    //     console.log('connection-建立端点的连接线', info)
    // })
  }

  // 绑定加载数据的操作数据
  bindLoadData() {
    document.querySelector('#loadData').addEventListener('click', () => {
      this.loadDataAndPaint()
    })
  }

  // 绑定保存数据的操作数据
  bindSaveData() {
    document.querySelector('#saveData').addEventListener('click', () => {
      const nodeData = this.getNodeData()
      const connectionData = this.getConnectionData()

      const visoData = {
        nodeData,
        connectionData,
      }

      console.log('保存数据', visoData)
      localStorage.setItem('visoData', JSON.stringify(visoData));
    })
  }

  // 绑定清除内容的操作数据
  bindClearData() {
    document.querySelector('#clearData').addEventListener('click', () => {
      this.clearCont()
    })
  }

  // 绑定删除节点操作
  bindRemoveNode() {
    document.querySelector(containerSelector).addEventListener('click', (event) => {
      if (this.matchesSelector(event.target, '.viso-close')) {
        const id = event.target.parentNode.getAttribute('id')
        jsPlumb.remove(id)
      }
    })
  }

  // 绑定节点内容编辑
  bindEditNodeName() {
    document.querySelector(containerSelector).addEventListener('dblclick', (event) => {
      let visoItem
      if (this.matchesSelector(event.target, '.viso-item')) {
        visoItem = event.target
      } else if (this.matchesSelector(event.target.parentNode, '.viso-item')) {
        visoItem = event.target.parentNode
      }
      if (visoItem !== undefined) {
        const eleName = visoItem.querySelector('.viso-name')
        const text = (eleName.innerText || eleName.textContent).replace(/^\s+|\s+$/g, '')
        const eleInput = visoItem.querySelector('.viso-input')

        if (eleInput) {
          eleInput.value = text
          eleInput.style.display = 'block'
          this.moveEnd(eleInput)
        } else {
          const appendInput = document.createElement('input')
          appendInput.className = 'viso-input'
          appendInput.value = text
          appendInput.addEventListener('blur', (event) => {
            this.saveInput(event.target)
          })
          visoItem.appendChild(appendInput)
          this.moveEnd(appendInput)
        }

        visoItem.querySelector('.viso-close').style.display = 'block'
      }
    })

    document.querySelector(containerSelector).addEventListener('keyup', (event) => {
      if (this.matchesSelector(event.target, '.viso-input')) {
        if (event.keyCode === 13) {
          this.saveInput(event.target)
        }
      }
    })
  }

  // 保存数据
  saveInput(ele) {
    const val = ele.value
    if (val.trim() !== '') {
      const eleName = ele.parentNode.querySelector('.viso-name')
      eleName.innerHTML = ''
      eleName.appendChild(document.createTextNode(val));
    }
    ele.style.display = 'none'
    ele.parentNode.querySelector('.viso-close').style.display = 'none'
  }

  // 光标移至末尾
  moveEnd(ele) {
    ele.focus();
    var len = ele.value.length;
    if (document.selection) {
      var sel = ele.createTextRange();
      sel.moveStart('character', len);
      sel.collapse();
      sel.select();
    } else if (typeof ele.selectionStart == 'number' && typeof ele.selectionEnd == 'number') {
      ele.selectionStart = ele.selectionEnd = len;
    }
  }

  // element.matches兼容处理
  matchesSelector(ele, selector) {
    if (ele.matches) {
      return ele.matches(selector);
    } else if (ele.matchesSelector) {
      return ele.matchesSelector(selector);
    } else if (ele.webkitMatchesSelector) {
      return ele.webkitMatchesSelector(selector);
    } else if (ele.msMatchesSelector) {
      return ele.msMatchesSelector(selector);
    } else if (ele.mozMatchesSelector) {
      return ele.mozMatchesSelector(selector);
    } else if (ele.oMatchesSelector) {
      return ele.oMatchesSelector(selector);
    }
  }

  // DOM渲染
  render() {
    return (
      <div id="visobox">
        <div id="operate">
          <div className="viso-item viso-start" data-type="start">开始</div>
          <div className="viso-item viso-gateway" data-type="gateway">条件</div>
          <div className="viso-item viso-task" data-type="task">任务</div>
          <div className="viso-item viso-end" data-type="end">结果</div>
          <hr />
          <div className="operate-item">
            <button id="loadData">加载数据</button>
          </div>
          <div className="operate-item">
            <button id="saveData">保存数据</button>
          </div>
          <div className="operate-item">
            <button id="clearData">清除内容</button>
          </div>
        </div>
        <div id="diagramContainer"></div>
      </div>
    )
  }
}
