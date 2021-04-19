if(NOT MIDDLEWARE_USB_HOST_COMMON_HEADER_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_USB_HOST_COMMON_HEADER_MK66F18_INCLUDED true CACHE BOOL "middleware_usb_host_common_header component is included.")


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/host
    )

    include(component_osa_MK66F18)

    include(middleware_usb_common_header_MK66F18)

endif()
