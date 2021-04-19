if(NOT MIDDLEWARE_USB_HOST_KHCI_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_USB_HOST_KHCI_MK66F18_INCLUDED true CACHE BOOL "middleware_usb_host_khci component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/host/usb_host_khci.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/host
        ${CMAKE_CURRENT_LIST_DIR}/include
    )


    include(middleware_usb_host_common_header_MK66F18)

endif()
