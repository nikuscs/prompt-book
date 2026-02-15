import type { ComponentProps } from "react"
import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { cn, createSmartFade } from "@/lib/utils"

interface ScrollAreaVanillaProps extends Omit<ComponentProps<"div">, "onScroll"> {
  threshold?: number
  maskWidth?: number
  fadeAlpha?: number
  fadeInset?: number
  scrollClickSize?: number
  labelDown?: string
  labelUp?: string
  labelLeft?: string
  labelRight?: string
  orientation?: "vertical" | "horizontal" | "both"
  viewportClassName?: string
  onScroll?: () => void
  onAtTop?: () => void
  onAtBottom?: () => void
  onAtLeft?: () => void
  onAtRight?: () => void
  onAtMiddle?: () => void
}

interface ScrollState {
  isAtTop: boolean
  isAtBottom: boolean
  isAtLeft: boolean
  isAtRight: boolean
  isAtMiddle: boolean
  showTopButton: boolean
  showBottomButton: boolean
  showLeftButton: boolean
  showRightButton: boolean
}

export function ScrollAreaVanilla({
  children,
  threshold = 0.5,
  maskWidth = 7,
  fadeAlpha = 0,
  fadeInset = 0,
  scrollClickSize = 100,
  labelUp = "More ↑",
  labelDown = "More ↓",
  labelLeft = "More ←",
  labelRight = "More →",
  className,
  orientation = "vertical",
  viewportClassName,
  onScroll,
  onAtTop,
  onAtBottom,
  onAtLeft,
  onAtRight,
  onAtMiddle,
  ...props
}: ScrollAreaVanillaProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState<ScrollState>({
    isAtTop: true,
    isAtBottom: false,
    isAtLeft: true,
    isAtRight: false,
    isAtMiddle: false,
    showTopButton: false,
    showBottomButton: false,
    showLeftButton: false,
    showRightButton: false,
  })

  const prevScrollStateRef = useRef<ScrollState>({
    isAtTop: true,
    isAtBottom: false,
    isAtLeft: true,
    isAtRight: false,
    isAtMiddle: false,
    showTopButton: false,
    showBottomButton: false,
    showLeftButton: false,
    showRightButton: false,
  })

  const suppressMiddleCallbackRef = useRef(false)
  const lastScrollTime = useRef(0)

  const handleScroll = useCallback(() => {
    if (!scrollerRef.current) return

    const now = Date.now()
    if (now - lastScrollTime.current < 16) return
    lastScrollTime.current = now

    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = scrollerRef.current

    const noVerticalScroll = scrollHeight <= clientHeight
    const isAtTop = scrollTop <= threshold
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold || noVerticalScroll

    const noHorizontalScroll = scrollWidth <= clientWidth
    const isAtLeft = scrollLeft <= threshold
    const isAtRight = scrollLeft + clientWidth >= scrollWidth - threshold || noHorizontalScroll

    const isAtMiddle =
      (!isAtTop && !isAtBottom) ||
      ((orientation === "horizontal" || orientation === "both") && !isAtLeft && !isAtRight)

    const buttonThreshold = threshold * 100
    const showTopButton = scrollTop > buttonThreshold
    const showBottomButton = scrollTop + clientHeight < scrollHeight - buttonThreshold && !noVerticalScroll
    const showLeftButton = scrollLeft > buttonThreshold
    const showRightButton = scrollLeft + clientWidth < scrollWidth - buttonThreshold && !noHorizontalScroll

    const newState = { isAtTop, isAtBottom, isAtLeft, isAtRight, isAtMiddle, showTopButton, showBottomButton, showLeftButton, showRightButton }
    const prevState = prevScrollStateRef.current

    if (
      newState.isAtTop !== prevState.isAtTop ||
      newState.isAtBottom !== prevState.isAtBottom ||
      newState.isAtLeft !== prevState.isAtLeft ||
      newState.isAtRight !== prevState.isAtRight ||
      newState.isAtMiddle !== prevState.isAtMiddle ||
      newState.showTopButton !== prevState.showTopButton ||
      newState.showBottomButton !== prevState.showBottomButton ||
      newState.showLeftButton !== prevState.showLeftButton ||
      newState.showRightButton !== prevState.showRightButton
    ) {
      setScrollState(newState)

      if (newState.isAtTop !== prevState.isAtTop && newState.isAtTop) {
        suppressMiddleCallbackRef.current = true
        onAtTop?.()
      }

      if (newState.isAtBottom !== prevState.isAtBottom && newState.isAtBottom) {
        suppressMiddleCallbackRef.current = true
        onAtBottom?.()
      }

      if ((orientation === "horizontal" || orientation === "both") && newState.isAtLeft !== prevState.isAtLeft && newState.isAtLeft) {
        suppressMiddleCallbackRef.current = true
        onAtLeft?.()
      }

      if ((orientation === "horizontal" || orientation === "both") && newState.isAtRight !== prevState.isAtRight && newState.isAtRight) {
        suppressMiddleCallbackRef.current = true
        onAtRight?.()
      }

      if (newState.isAtMiddle !== prevState.isAtMiddle && newState.isAtMiddle) {
        if (!suppressMiddleCallbackRef.current) onAtMiddle?.()
        setTimeout(() => {
          suppressMiddleCallbackRef.current = false
        }, 100)
      }

      prevScrollStateRef.current = newState
    }

    onScroll?.()
  }, [threshold, orientation, onAtTop, onAtBottom, onAtLeft, onAtRight, onAtMiddle, onScroll])

  function onScrollDown() {
    scrollerRef.current?.scrollBy({ top: scrollClickSize, behavior: "smooth" })
  }

  function onScrollUp() {
    scrollerRef.current?.scrollBy({ top: -scrollClickSize, behavior: "smooth" })
  }

  function onScrollLeft() {
    scrollerRef.current?.scrollBy({ left: -scrollClickSize, behavior: "smooth" })
  }

  function onScrollRight() {
    scrollerRef.current?.scrollBy({ left: scrollClickSize, behavior: "smooth" })
  }

  useLayoutEffect(() => {
    if (scrollerRef.current) handleScroll()
  }, [handleScroll, children])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const onResize = () => handleScroll()
    const observer = new ResizeObserver(() => handleScroll())
    observer.observe(scroller)
    window.addEventListener("resize", onResize)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [handleScroll])

  let overflowClass = "overflow-y-auto overflow-x-hidden"
  if (orientation === "both") {
    overflowClass = "overflow-auto"
  } else if (orientation === "horizontal") {
    overflowClass = "overflow-x-auto overflow-y-hidden"
  }

  const fadeOptions = { overflow: false, width: maskWidth, alpha: fadeAlpha, inset: fadeInset }

  const verticalMask =
    orientation !== "horizontal" ? createSmartFade("vertical", fadeOptions, !scrollState.isAtTop, !scrollState.isAtBottom) : "none"

  const horizontalMask =
    orientation === "horizontal" || orientation === "both"
      ? createSmartFade("horizontal", fadeOptions, !scrollState.isAtLeft, !scrollState.isAtRight)
      : "none"

  let combinedMask = "none"
  if (orientation === "both" && verticalMask !== "none" && horizontalMask !== "none") {
    combinedMask = `${verticalMask}, ${horizontalMask}`
  } else if (verticalMask !== "none") {
    combinedMask = verticalMask
  } else {
    combinedMask = horizontalMask
  }

  return (
    <div className={cn("relative size-full overflow-hidden", className)} {...props}>
      <div
        className={cn(
          "scroll-area relative size-full p-4 scroll-smooth [scrollbar-gutter:stable] scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent",
          overflowClass,
          viewportClassName,
        )}
        ref={scrollerRef}
        style={{ WebkitMaskImage: combinedMask, maskImage: combinedMask }}
        onScroll={handleScroll}
      >
        {children}
      </div>

      <>
        <AnimatePresence>
          {scrollState.showBottomButton ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-0 bottom-2 z-10 flex cursor-pointer select-none items-center justify-center"
                exit={{ opacity: 0, y: 10 }}
                initial={{ opacity: 0, y: 10 }}
                role="button"
                tabIndex={0}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onClick={onScrollDown}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onScrollDown()
                }}
              >
                <Badge className="select-none px-1.5 py-1 text-[0.6rem] leading-none" variant="secondary">
                  {labelDown}
                </Badge>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <AnimatePresence>
            {scrollState.showTopButton ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-0 top-2 z-10 flex cursor-pointer select-none items-center justify-center"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: -10 }}
                role="button"
                tabIndex={0}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onClick={onScrollUp}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onScrollUp()
                }}
              >
                <Badge className="select-none px-1.5 py-1 text-[0.6rem] leading-none" variant="secondary">
                  {labelUp}
                </Badge>
              </motion.div>
            ) : null}
        </AnimatePresence>
      </>

      {orientation === "horizontal" || orientation === "both" ? (
        <>
          <AnimatePresence>
            {scrollState.showLeftButton ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-y-0 left-2 z-10 flex cursor-pointer select-none items-center justify-center"
                exit={{ opacity: 0, x: -10 }}
                initial={{ opacity: 0, x: -10 }}
                role="button"
                tabIndex={0}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onClick={onScrollLeft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onScrollLeft()
                }}
              >
                <Badge className="select-none px-1.5 py-1 text-[0.6rem] leading-none" variant="secondary">
                  {labelLeft}
                </Badge>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <AnimatePresence>
            {scrollState.showRightButton ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-y-0 right-2 z-10 flex cursor-pointer select-none items-center justify-center"
                exit={{ opacity: 0, x: 10 }}
                initial={{ opacity: 0, x: 10 }}
                role="button"
                tabIndex={0}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onClick={onScrollRight}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onScrollRight()
                }}
              >
                <Badge className="select-none px-1.5 py-1 text-[0.6rem] leading-none" variant="secondary">
                  {labelRight}
                </Badge>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </div>
  )
}
