if(NOT MIDDLEWARE_FATFS_USB_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_FATFS_USB_MK66F18_INCLUDED true CACHE BOOL "middleware_fatfs_usb component is included.")

    if(CONFIG_USE_middleware_baremetal_MK66F18)
    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/source/fsl_usb_disk/fsl_usb_disk_bm.c
    )
    elseif(CONFIG_USE_middleware_freertos-kernel_MK66F18)
    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/source/fsl_usb_disk/fsl_usb_disk_freertos.c
    )
    else()
        message(WARNING "please config middleware.baremetal_MK66F18 or middleware.freertos-kernel_MK66F18 first.")
    endif()


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/source/fsl_usb_disk
    )


    include(middleware_fatfs_MK66F18)

    include(middleware_usb_host_stack_MK66F18)

    include(middleware_usb_host_msd_MK66F18)

endif()
