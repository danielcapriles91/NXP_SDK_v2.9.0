if(NOT MIDDLEWARE_MCU-BOOT_DRV_MMCAU_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_MCU-BOOT_DRV_MMCAU_MK66F18_INCLUDED true CACHE BOOL "middleware_mcu-boot_drv_mmcau component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/src/drivers/mmcau/src/mmcau_aes_functions.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/src/drivers/mmcau
    )


endif()
