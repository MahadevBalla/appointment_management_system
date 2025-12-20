import * as React from "react"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"

const DropdownMenuContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: null,
})

const DropdownMenu = ({ children, ...props }) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef(null)
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block" {...props}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef(({ className, asChild, children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)
  
  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(!open)
    props.onClick?.(e)
  }
  
  const combinedRef = (node) => {
    triggerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: combinedRef,
      onClick: handleClick,
    })
  }
  
  return (
    <button 
      ref={combinedRef} 
      className={cn(className)} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef(({ className, align = "start", ...props }, ref) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)
  const contentRef = React.useRef(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      
      let left = triggerRect.left + scrollLeft
      const top = triggerRect.bottom + scrollTop + 8 // 8px gap
      
      // Adjust horizontal alignment
      if (align === 'end') {
        left = triggerRect.right + scrollLeft
      } else if (align === 'center') {
        left = triggerRect.left + scrollLeft + (triggerRect.width / 2)
      }
      
      setPosition({ top, left })
    }
  }, [open, align, triggerRef])
  
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target) && 
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [open, setOpen, triggerRef])
  
  if (!open) return null
  
  const alignmentClasses = {
    start: '',
    center: '-translate-x-1/2',
    end: '-translate-x-full',
  }
  
  const content = (
    <div
      ref={(node) => {
        contentRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className={cn(
        "fixed z-[99999] min-w-[10rem] overflow-hidden rounded-lg border border-gray-200 bg-white p-1.5 shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        alignmentClasses[align],
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
      {...props}
    />
  )
  
  return createPortal(content, document.body)
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef(({ className, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = (e) => {
    props.onClick?.(e)
    setOpen(false)
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none transition-colors",
        "hover:bg-teal-50 hover:text-teal-900 focus:bg-teal-50 focus:text-teal-900 active:bg-teal-100",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}

