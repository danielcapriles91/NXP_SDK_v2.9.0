if(NOT MIDDLEWARE_SDMMC_HOST_SDHC_FREERTOS_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_SDMMC_HOST_SDHC_FREERTOS_MK66F18_INCLUDED true CACHE BOOL "middleware_sdmmc_host_sdhc_freertos component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/host/sdhc/non_blocking/fsl_sdmmc_host.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/host/sdhc
    )


    include(middleware_sdmmc_common_MK66F18)

    include(middleware_sdmmc_osa_freertos_MK66F18)

    include(driver_sdhc_MK66F18)

endif()
