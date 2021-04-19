if(NOT MIDDLEWARE_SDMMC_HOST_SDHC_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_SDMMC_HOST_SDHC_MK66F18_INCLUDED true CACHE BOOL "middleware_sdmmc_host_sdhc component is included.")


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/host/sdhc
    )

    #OR Logic component
    if(CONFIG_USE_middleware_sdmmc_host_sdhc_freertos_MK66F18)
         include(middleware_sdmmc_host_sdhc_freertos_MK66F18)
    endif()
    if(CONFIG_USE_middleware_sdmmc_host_sdhc_interrupt_MK66F18)
         include(middleware_sdmmc_host_sdhc_interrupt_MK66F18)
    endif()
    if(CONFIG_USE_middleware_sdmmc_host_sdhc_polling_MK66F18)
         include(middleware_sdmmc_host_sdhc_polling_MK66F18)
    endif()
    if(NOT (CONFIG_USE_middleware_sdmmc_host_sdhc_freertos_MK66F18 OR CONFIG_USE_middleware_sdmmc_host_sdhc_interrupt_MK66F18 OR CONFIG_USE_middleware_sdmmc_host_sdhc_polling_MK66F18))
        message(WARNING "Since middleware_sdmmc_host_sdhc_freertos_MK66F18/middleware_sdmmc_host_sdhc_interrupt_MK66F18/middleware_sdmmc_host_sdhc_polling_MK66F18 is not included at first or config in config.cmake file, use middleware_sdmmc_host_sdhc_interrupt_MK66F18 by default.")
        include(middleware_sdmmc_host_sdhc_interrupt_MK66F18)
    endif()

endif()
