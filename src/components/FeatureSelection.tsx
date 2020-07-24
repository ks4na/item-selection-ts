import React from 'react'

import './style.scss'
import { App as EditorWithMask } from './editor-with-mask'
import { itemGroup as defaultItemGroup } from './data'

const DEFAULT_MASK: MaskProps = {
  pos: [0, 0],
  size: [0, 0],
}

export default function FeatureSelection() {
  const [mask, setMask] = React.useState<MaskProps | false>(false)
  const [itemGroup, setItemGroup] = React.useState<ItemType[]>(
    defaultItemGroup as ItemType[]
  )
  const startPosRef = React.useRef<Position | undefined>() // 记录鼠标按下时的位置

  const handleEditorMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const recursiveOffset = recursiveGetOffset(e.target as HTMLElement)

      startPosRef.current = {
        x: e.pageX - recursiveOffset.x,
        y: e.pageY - recursiveOffset.y,
      }

      const newMask: MaskProps = {
        ...DEFAULT_MASK,
        pos: [e.pageX - recursiveOffset.x, e.pageX - recursiveOffset.x],
      }
      setMask(newMask)

      // 重置 itemGroup 中项的 actived 属性为 false
      setItemGroup((prevState) =>
        prevState.map((item) => ({
          ...item,
          actived: false,
        }))
      )
    },
    []
  )

  const handleEidtorMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (startPosRef.current) {
        const recursiveOffset = recursiveGetOffset(e.target as HTMLElement)
        const currentCursorPos: Position = {
          x: e.pageX - recursiveOffset.x,
          y: e.pageY - recursiveOffset.y,
        }

        const newMaskSize: Size = {
          x: Math.abs(currentCursorPos.x - startPosRef.current.x),
          y: Math.abs(currentCursorPos.y - startPosRef.current.y),
        }

        // 如果当前指针位置在开始位置的左方/上方，切换开始位置
        const startPosX =
          currentCursorPos.x < startPosRef.current.x
            ? currentCursorPos.x
            : startPosRef.current.x
        const startPosY =
          currentCursorPos.y < startPosRef.current.y
            ? currentCursorPos.y
            : startPosRef.current.y

        const newMask: MaskProps = {
          pos: [startPosX, startPosY],
          size: [newMaskSize.x, newMaskSize.y],
        }

        setMask(newMask)

        // 更新 itemGroup 中项的 actived 属性
        setItemGroup((prevState) =>
          prevState.map((item) => ({
            ...item,
            actived: hasIntersection(item, newMask),
          }))
        )
      }
    },
    []
  )

  const handleEditorMouseUp = React.useCallback(() => {
    if (startPosRef.current) {
      if (mask && (mask.size[0] !== 0 || mask.size[1] !== 0)) {
        const activedItems = itemGroup
          .filter((item) => item.actived)
          .map((item) => ({ id: item.id, value: item.value }))
        if (activedItems.length) {
          console.table(activedItems)
        } else {
          console.log('no selected items')
        }
      }

      startPosRef.current = undefined
      setMask(false)
    }
  }, [itemGroup, mask])

  const editorWithMaskProps = {
    itemGroup,
    mask,
  }

  // 处理选区过程中移出 editor 区域时取消选区操作
  // const handleEditorMouseLeave = React.useCallback(() => {
  //   if (startPosRef.current) {
  //     startPosRef.current = undefined
  //     setMask(false)

  //     // 重置 itemGroup 中项的 actived 属性为 false
  //     setItemGroup((prevState) =>
  //       prevState.map((item) => ({
  //         ...item,
  //         actived: false,
  //       }))
  //     )
  //   }
  // }, [])

  return (
    <div
      className={'editor-wrapper'}
      style={{
        position: 'relative',
        height: '540px',
        background: 'lightgreen',
      }}
      onMouseDown={handleEditorMouseDown}
      onMouseMove={handleEidtorMouseMove}
      onMouseUp={handleEditorMouseUp}
      // onMouseLeave={handleEditorMouseLeave}
    >
      <EditorWithMask {...editorWithMaskProps} />
    </div>
  )
}

/* utils */

// 递归获取 element 相对于整个页面的偏移量
export function recursiveGetOffset(
  element: Node & ParentNode,
  initialOffset: Position = { x: 0, y: 0 }
): Position {
  const eleOffsetInfo: Position = {
    x: (element as HTMLElement).offsetLeft || 0,
    y: (element as HTMLElement).offsetTop || 0,
  }

  initialOffset.x += eleOffsetInfo.x
  initialOffset.y += eleOffsetInfo.y

  if (element.parentNode) {
    recursiveGetOffset(element.parentNode, initialOffset)
  }

  return initialOffset
}

// 判断 item 与 mask 区域是否有交集
export function hasIntersection(item: ItemType, mask: MaskProps): boolean {
  const rangeOfItemX = [item.pos[0], item.pos[0] + item.size[0]]
  const rangeOfItemY = [item.pos[1], item.pos[1] + item.size[1]]

  const rangeOfMaskX = [mask.pos[0], mask.pos[0] + mask.size[0]]
  const rangeOfMaskY = [mask.pos[1], mask.pos[1] + mask.size[1]]

  if (
    rangeOfItemX[0] <= rangeOfMaskX[1] &&
    rangeOfItemX[1] >= rangeOfMaskX[0] &&
    rangeOfItemY[0] <= rangeOfMaskY[1] &&
    rangeOfItemY[1] >= rangeOfMaskY[0]
  ) {
    return true
  } else {
    return false
  }
}

/* types */

export interface MaskProps {
  pos: [number, number]
  size: [number, number]
}

export interface ItemType {
  type: string
  id: string
  pos: [number, number]
  size: [number, number]
  value: string
  actived?: boolean
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  x: number
  y: number
}
