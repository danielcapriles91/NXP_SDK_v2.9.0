if(NOT MIDDLEWARE_USB_DEVICE_CONTROLLER_DRIVER_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_USB_DEVICE_CONTROLLER_DRIVER_MK66F18_INCLUDED true CACHE BOOL "middleware_usb_device_controller_driver component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/device/usb_device_dci.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/device
    )


    #OR Logic component
    if(CONFIG_USE_middleware_usb_device_khci_MK66F18)
         include(middleware_usb_device_khci_MK66F18)
    endif()
    if(CONFIG_USE_middleware_usb_device_ehci_MK66F18)
         include(middleware_usb_device_ehci_MK66F18)
    endif()
    if(CONFIG_USE_middleware_usb_device_ip3511fs_MK66F18)
         include(middleware_usb_device_ip3511fs_MK66F18)
    endif()
    if(CONFIG_USE_middleware_usb_device_ip3511hs_MK66F18)
         include(middleware_usb_device_ip3511hs_MK66F18)
    endif()
    if(NOT (CONFIG_USE_middleware_usb_device_khci_MK66F18 OR CONFIG_USE_middleware_usb_device_ehci_MK66F18 OR CONFIG_USE_middleware_usb_device_ip3511fs_MK66F18 OR CONFIG_USE_middleware_usb_device_ip3511hs_MK66F18))
        message(WARNING "Since middleware_usb_device_khci_MK66F18/middleware_usb_device_ehci_MK66F18/middleware_usb_device_ip3511fs_MK66F18/middleware_usb_device_ip3511hs_MK66F18 is not included at first or config in config.cmake file, use middleware_usb_device_khci_MK66F18 by default.")
        include(middleware_usb_device_khci_MK66F18)
    endif()

    include(component_osa_MK66F18)

endif()
