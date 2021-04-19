if(NOT MIDDLEWARE_LWIP_USB_ETHERNETIF_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_LWIP_USB_ETHERNETIF_MK66F18_INCLUDED true CACHE BOOL "middleware_lwip_usb_ethernetif component is included.")

    if(CONFIG_USE_middleware_baremetal_MK66F18)
    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/port/usb_ethernetif_bm.c
    )
    elseif(CONFIG_USE_middleware_freertos-kernel_MK66F18)
    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/port/usb_ethernetif_freertos.c
    )
    else()
        message(WARNING "please config middleware.baremetal_MK66F18 or middleware.freertos-kernel_MK66F18 first.")
    endif()


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/port
    )


    #OR Logic component
    if(CONFIG_USE_middleware_usb_host_khci_MK66F18)
         include(middleware_usb_host_khci_MK66F18)
    endif()
    if(CONFIG_USE_middleware_usb_host_ehci_MK66F18)
         include(middleware_usb_host_ehci_MK66F18)
    endif()
    if(CONFIG_USE_middleware_usb_host_ohci_MK66F18)
         include(middleware_usb_host_ohci_MK66F18)
    endif()
    if(NOT (CONFIG_USE_middleware_usb_host_khci_MK66F18 OR CONFIG_USE_middleware_usb_host_ehci_MK66F18 OR CONFIG_USE_middleware_usb_host_ohci_MK66F18))
        message(WARNING "Since middleware_usb_host_khci_MK66F18/middleware_usb_host_ehci_MK66F18/middleware_usb_host_ohci_MK66F18 is not included at first or config in config.cmake file, use middleware_usb_host_ehci_MK66F18 by default.")
        include(middleware_usb_host_ehci_MK66F18)
    endif()

    include(middleware_lwip_MK66F18)

    include(middleware_usb_host_cdc_MK66F18)

    include(middleware_usb_host_cdc_rndis_MK66F18)

endif()
